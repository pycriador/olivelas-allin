-- =============================================================================
-- Hotfix: recriar cancel_campaign_reservation (404 na API)
-- =============================================================================
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

GRANT EXECUTE ON FUNCTION public.cancel_campaign_reservation(uuid, uuid) TO anon, authenticated;
