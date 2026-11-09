-- =============================================================================
-- Admin Payment Ledger.
--
-- O /admin/pagamentos deve listar TODOS os pagamentos da plataforma, de todos
-- os usuários, incluindo:
--   * Pagamentos via gateway (payments) — PIX online.
--   * Pagamentos antigos já registrados e manuais feitos via GRID / importação /
--     WhatsApp (orders com status PAID/REFUNDED que NÃO têm pagamento de
--     gateway confirmado na tabela payments).
--
-- Solução: um VIEW unificado (admin_payment_ledger) faz a união, com a coluna
-- `kind` identificando a origem ('GATEWAY' | 'MANUAL').
--
-- Requisito: o enum payment_gateway já deve conter 'MANUAL' (ver
-- add_payment_gateway_manual.sql — roda em transação anterior).
-- =============================================================================

CREATE OR REPLACE VIEW public.admin_payment_ledger AS
SELECT
  p.id AS id,
  p.order_id AS order_id,
  p.campaign_id AS campaign_id,
  p.customer_id AS customer_id,
  p.gateway AS gateway,
  p.environment AS environment,
  p.gateway_payment_id AS gateway_payment_id,
  p.gateway_order_id AS gateway_order_id,
  p.method AS method,
  p.status AS status,
  p.attempt_number AS attempt_number,
  p.amount AS amount,
  p.currency AS currency,
  p.pix_qr_code AS pix_qr_code,
  p.pix_copy_paste AS pix_copy_paste,
  p.expires_at AS expires_at,
  p.paid_at AS paid_at,
  p.cancelled_at AS cancelled_at,
  p.refunded_at AS refunded_at,
  p.failure_code AS failure_code,
  p.failure_message AS failure_message,
  p.created_at AS created_at,
  p.updated_at AS updated_at,
  p.metadata AS metadata,
  'GATEWAY'::text AS kind
FROM public.payments p
UNION ALL
SELECT
  o.id AS id,
  o.id AS order_id,
  o.campaign_id AS campaign_id,
  o.customer_id AS customer_id,
  'MANUAL'::public.payment_gateway AS gateway,
  'SANDBOX'::public.payment_environment AS environment,
  NULL::text AS gateway_payment_id,
  NULL::text AS gateway_order_id,
  (CASE o.payment_method
     WHEN 'PIX' THEN 'PIX'
     WHEN 'CARTAO' THEN 'CREDIT_CARD'
     WHEN 'TRANSFERENCIA' THEN 'PIX'
     ELSE 'PIX'
   END)::public.payment_method_type AS method,
  (CASE o.status
     WHEN 'REFUNDED' THEN 'REFUNDED'::public.payment_status
     ELSE 'PAID'::public.payment_status
   END) AS status,
  1 AS attempt_number,
  o.total AS amount,
  'BRL'::text AS currency,
  NULL::text AS pix_qr_code,
  NULL::text AS pix_copy_paste,
  NULL::timestamptz AS expires_at,
  o.updated_at AS paid_at,
  NULL::timestamptz AS cancelled_at,
  NULL::timestamptz AS refunded_at,
  NULL::text AS failure_code,
  NULL::text AS failure_message,
  o.created_at AS created_at,
  o.updated_at AS updated_at,
  '{}'::jsonb AS metadata,
  'MANUAL'::text AS kind
FROM public.orders o
WHERE o.status IN ('PAID', 'REFUNDED')
  AND NOT EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.order_id = o.id
      AND p.status IN ('PAID', 'REFUNDED')
  );

GRANT SELECT ON public.admin_payment_ledger TO authenticated, service_role;
