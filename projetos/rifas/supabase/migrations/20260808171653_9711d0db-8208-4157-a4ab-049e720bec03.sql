-- Admin-only order/number routines: no PUBLIC/anon execute
REVOKE ALL ON FUNCTION public.create_manual_order(uuid, uuid, public.payment_method, numeric, text, bigint[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_manual_order(uuid, uuid, public.payment_method, numeric, text, bigint[], public.order_status) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_manage_number(uuid, bigint, public.campaign_number_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_manual_order(uuid, uuid, public.payment_method, numeric, text, bigint[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_manual_order(uuid, uuid, public.payment_method, numeric, text, bigint[], public.order_status) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_manage_number(uuid, bigint, public.campaign_number_status) TO authenticated, service_role;

-- Internal helpers must not be callable from the API at all
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_global_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_global_admin() TO service_role;

-- Anonymous visitors only need to read; strip write privileges
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.campaign_numbers FROM anon;

-- Reservation token / reserver identity stay hidden from anonymous readers
REVOKE SELECT ON TABLE public.campaign_numbers FROM anon;
GRANT SELECT (id, campaign_id, number, status, reserved_until, purchase_id, created_at, updated_at)
  ON public.campaign_numbers TO anon;