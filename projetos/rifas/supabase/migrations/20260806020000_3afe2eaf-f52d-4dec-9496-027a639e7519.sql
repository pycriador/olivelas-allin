-- CAMPAIGN NUMBERS: Sprint 4 — seleção, reservas temporárias e realtime
--
-- Princípios:
--   * A grade é gerada dinamicamente a partir de campaigns.number_start/end.
--   * Números disponíveis NÃO possuem registro: apenas os que deixaram
--     AVAILABLE são persistidos (RESERVED/PENDING_PAYMENT/PAID/BLOCKED/
--     CANCELLED/WINNER).
--   * Reservas são transacionais (advisory lock + unique constraint) para
--     nunca permitir que dois clientes reservem o mesmo número.
--   * A liberação automática de reservas expiradas acontece via
--     release_expired_campaign_reservations() (RPC) agendada com pg_cron e
--     com fallback periódico no cliente.

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------
CREATE TYPE public.campaign_number_status AS ENUM (
  'AVAILABLE', 'RESERVED', 'PENDING_PAYMENT', 'PAID', 'BLOCKED', 'CANCELLED', 'WINNER'
);

-- ---------------------------------------------------------------------------
-- campaign_numbers
-- ---------------------------------------------------------------------------
CREATE TABLE public.campaign_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  number BIGINT NOT NULL,
  status public.campaign_number_status NOT NULL DEFAULT 'AVAILABLE',
  reserved_by UUID,
  reservation_token UUID,
  reserved_until TIMESTAMPTZ,
  purchase_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_numbers_campaign_number_key UNIQUE (campaign_id, number),
  CONSTRAINT campaign_numbers_reserved_until_check CHECK (
    (status IN ('RESERVED', 'PENDING_PAYMENT') AND reserved_until IS NOT NULL)
    OR (status NOT IN ('RESERVED', 'PENDING_PAYMENT') AND reserved_until IS NULL)
  )
);

COMMENT ON TABLE public.campaign_numbers IS
  'Estados dos números por campanha. Números AVAILABLE não possuem linha.';

CREATE INDEX campaign_numbers_campaign_status_idx ON public.campaign_numbers (campaign_id, status);
CREATE INDEX campaign_numbers_campaign_number_idx ON public.campaign_numbers (campaign_id, number);
CREATE INDEX campaign_numbers_token_idx ON public.campaign_numbers (reservation_token);
CREATE INDEX campaign_numbers_reserved_until_idx ON public.campaign_numbers (reserved_until)
  WHERE reserved_until IS NOT NULL;

CREATE TRIGGER campaign_numbers_updated_at BEFORE UPDATE ON public.campaign_numbers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Helper de auditoria para eventos de reserva (SECURITY DEFINER: o RPC usa
-- permissões do owner, que também insere em audit_logs).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_reservation_audit(
  p_action TEXT,
  p_campaign_id UUID,
  p_token UUID,
  p_actor_id UUID,
  p_metadata JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, metadata)
  VALUES (p_actor_id, p_action, 'campaign_number', p_campaign_id::text,
          COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('token', p_token));
END; $$;

-- ---------------------------------------------------------------------------
-- reserve_campaign_numbers — reserva atômica de um lote de números.
--
-- Usa pg_advisory_xact_lock(campaign) para serializar reservas da mesma
-- campanha + UNIQUE (campaign_id, number) como restrição final. Todos os
-- números do lote compartilham o mesmo reservation_token (UUID).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_campaign_numbers(
  p_campaign_id UUID,
  p_numbers BIGINT[],
  p_reserved_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign_row public.campaigns%ROWTYPE;
  token UUID := gen_random_uuid();
  reserved_until_ts TIMESTAMPTZ;
  conflicts BIGINT[];
  out_of_range BIGINT[];
  duplicate_count INTEGER;
  recent_count INTEGER;
  total_requested INTEGER;
BEGIN
  SELECT * INTO campaign_row
  FROM public.campaigns
  WHERE id = p_campaign_id AND deleted_at IS NULL;

  IF campaign_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CAMPAIGN_NOT_FOUND');
  END IF;

  IF campaign_row.visibility <> 'PUBLIC' OR campaign_row.status <> 'ACTIVE' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CAMPAIGN_NOT_ACTIVE');
  END IF;

  IF p_numbers IS NULL OR array_length(p_numbers, 1) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_NUMBERS');
  END IF;

  -- Rate limit: até 10 lotes por dispositivo por minuto.
  SELECT count(*) INTO recent_count
  FROM public.campaign_numbers
  WHERE reserved_by = p_reserved_by
    AND created_at > now() - interval '60 seconds';
  IF recent_count >= 10 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'RATE_LIMITED');
  END IF;

  -- Serializa reservas concorrentes da mesma campanha.
  PERFORM pg_advisory_xact_lock(hashtext('rafflehub_campaign'), hashtext(p_campaign_id::text));

  -- Remove duplicatas do lote.
  SELECT array_agg(DISTINCT x.n ORDER BY x.n) INTO p_numbers
  FROM unnest(p_numbers) AS x(n);

  SELECT count(*) INTO total_requested FROM unnest(p_numbers) AS x(n);

  -- Valida faixa.
  SELECT array_agg(x.n ORDER BY x.n) INTO out_of_range
  FROM unnest(p_numbers) AS x(n)
  WHERE x.n < campaign_row.number_start OR x.n > campaign_row.number_end;
  IF out_of_range IS NOT NULL AND array_length(out_of_range, 1) > 0 THEN
    PERFORM public.log_reservation_audit('RESERVATION_INVALID', p_campaign_id, NULL,
      p_reserved_by, jsonb_build_object('numbers', out_of_range, 'reason', 'OUT_OF_RANGE'));
    RETURN jsonb_build_object('ok', false, 'error', 'NUMBER_OUT_OF_RANGE', 'numbers', out_of_range);
  END IF;

  -- Valida limite por compra.
  IF campaign_row.max_numbers_per_purchase IS NOT NULL
     AND total_requested > campaign_row.max_numbers_per_purchase THEN
    PERFORM public.log_reservation_audit('RESERVATION_INVALID', p_campaign_id, NULL,
      p_reserved_by, jsonb_build_object('count', total_requested, 'reason', 'MAX_NUMBERS_EXCEEDED'));
    RETURN jsonb_build_object('ok', false, 'error', 'MAX_NUMBERS_EXCEEDED');
  END IF;

  -- Conflito: algum número já deixou AVAILABLE.
  SELECT array_agg(n.number ORDER BY n.number) INTO conflicts
  FROM public.campaign_numbers n
  WHERE n.campaign_id = p_campaign_id AND n.number = ANY(p_numbers);
  IF conflicts IS NOT NULL AND array_length(conflicts, 1) > 0 THEN
    PERFORM public.log_reservation_audit('RESERVATION_INVALID', p_campaign_id, NULL,
      p_reserved_by, jsonb_build_object('numbers', conflicts, 'reason', 'CONFLICT'));
    RETURN jsonb_build_object('ok', false, 'error', 'CONFLICT', 'numbers', conflicts);
  END IF;

  reserved_until_ts := now() + make_interval(mins => campaign_row.reservation_timeout_minutes);

  INSERT INTO public.campaign_numbers (campaign_id, number, status, reserved_by, reservation_token, reserved_until)
  SELECT p_campaign_id, x.n, 'RESERVED'::public.campaign_number_status,
         p_reserved_by, token, reserved_until_ts
  FROM unnest(p_numbers) AS x(n);

  PERFORM public.log_reservation_audit('RESERVATION_CREATED', p_campaign_id, token,
    p_reserved_by, jsonb_build_object('numbers', p_numbers, 'count', total_requested,
      'reserved_until', reserved_until_ts, 'timeout_minutes', campaign_row.reservation_timeout_minutes));

  RETURN jsonb_build_object(
    'ok', true,
    'token', token,
    'reserved_until', reserved_until_ts,
    'timeout_minutes', campaign_row.reservation_timeout_minutes,
    'numbers', p_numbers,
    'count', total_requested
  );
END; $$;

-- ---------------------------------------------------------------------------
-- release_expired_campaign_reservations — libera reservas expiradas.
-- Remove as linhas (número volta a AVAILABLE) e registra auditoria.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_expired_campaign_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  released INTEGER;
BEGIN
  WITH expired AS (
    SELECT id, campaign_id, number, reserved_by, reservation_token, created_at
    FROM public.campaign_numbers
    WHERE status IN ('RESERVED', 'PENDING_PAYMENT')
      AND reserved_until IS NOT NULL
      AND reserved_until <= now()
  ), deleted AS (
    DELETE FROM public.campaign_numbers
    USING expired
    WHERE public.campaign_numbers.id = expired.id
    RETURNING expired.campaign_id, expired.reservation_token, expired.created_at
  )
  SELECT count(*) INTO released FROM deleted;

  IF released > 0 THEN
    INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, metadata)
    SELECT NULL, 'RESERVATION_EXPIRED', 'campaign_number', campaign_id::text,
           jsonb_build_object(
             'count', count(*),
             'token', reservation_token,
             'held_ms', GREATEST(0, EXTRACT(EPOCH FROM (now() - min(created_at))) * 1000)::bigint
           )
    FROM deleted
    GROUP BY campaign_id, reservation_token;
  END IF;

  RETURN released;
END; $$;

-- ---------------------------------------------------------------------------
-- cancel_campaign_reservation — libera uma reserva pelo token (o cliente que
-- a criou pode desistir). Apenas do próprio dispositivo (reserved_by).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_campaign_reservation(
  p_token UUID,
  p_reserved_by UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cancelled INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.campaign_numbers
    WHERE reservation_token = p_token
      AND reserved_by = p_reserved_by
    RETURNING campaign_id, number
  )
  SELECT count(*) INTO cancelled FROM deleted;

  IF cancelled > 0 THEN
    INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, metadata)
    SELECT NULL, 'RESERVATION_CANCELLED', 'campaign_number', campaign_id::text,
           jsonb_build_object('token', p_token, 'count', count(*))
    FROM deleted
    GROUP BY campaign_id;
  END IF;

  RETURN cancelled;
END; $$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.campaign_numbers TO anon;
GRANT SELECT ON public.campaign_numbers TO authenticated;
GRANT ALL ON public.campaign_numbers TO service_role;

GRANT EXECUTE ON FUNCTION public.reserve_campaign_numbers(uuid, bigint[], uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_expired_campaign_reservations() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_campaign_reservation(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_reservation_audit(text, uuid, uuid, uuid, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.reserve_campaign_numbers(uuid, bigint[], uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_expired_campaign_reservations() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_campaign_reservation(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_reservation_audit(text, uuid, uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.campaign_numbers ENABLE ROW LEVEL SECURITY;

-- Anônimos leem os números de campanhas públicas (necessário para a grade da
-- página pública e para o Realtime entregar mudanças a visitantes).
CREATE POLICY "Public read campaign numbers" ON public.campaign_numbers FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_id
      AND c.visibility = 'PUBLIC'
      AND c.deleted_at IS NULL
      AND c.status IN ('SCHEDULED', 'ACTIVE', 'PAUSED', 'FINISHED')
  )
);

-- Autenticados (admins) leem todas as linhas.
CREATE POLICY "Admins read campaign numbers" ON public.campaign_numbers FOR SELECT TO authenticated
USING (public.is_global_admin());

-- Escrita só via RPC (SECURITY DEFINER); admins também podem gerenciar.
CREATE POLICY "Admins manage campaign numbers" ON public.campaign_numbers FOR ALL TO authenticated
USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

-- ---------------------------------------------------------------------------
-- Realtime: transmitir mudanças de números para todos os clientes.
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_numbers;

-- ---------------------------------------------------------------------------
-- Job automático: libera reservas expiradas a cada minuto.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
  'release-expired-campaign-reservations',
  '* * * * *',
  'SELECT public.release_expired_campaign_reservations();'
);
