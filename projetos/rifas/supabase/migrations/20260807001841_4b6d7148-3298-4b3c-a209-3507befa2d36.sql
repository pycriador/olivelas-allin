-- 1) Internal-only helpers: no direct API execution at all
REVOKE ALL ON FUNCTION public.log_order_audit(text, uuid, uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_reservation_audit(text, uuid, uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_campaign() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_expired_campaign_reservations() FROM PUBLIC, anon, authenticated;

-- 2) Admin-only order RPCs: signed-in only (function body still enforces GLOBAL_ADMIN)
REVOKE ALL ON FUNCTION public.create_manual_order(uuid, uuid, public.payment_method, numeric, text, bigint[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.import_sold_numbers(uuid, uuid, public.payment_method, text, bigint[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_order_numbers(uuid, bigint[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_order_numbers(uuid, bigint[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.swap_order_number(uuid, bigint, bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_order_status(uuid, public.order_status) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_global_admin() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_manual_order(uuid, uuid, public.payment_method, numeric, text, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_sold_numbers(uuid, uuid, public.payment_method, text, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_order_numbers(uuid, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_order_numbers(uuid, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.swap_order_number(uuid, bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_order_status(uuid, public.order_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_global_admin() TO authenticated;

-- 3) Public reservation flows stay callable by visitors (they validate internally)
GRANT EXECUTE ON FUNCTION public.reserve_campaign_numbers(uuid, bigint[], uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_campaign_reservation(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_whatsapp_order(uuid, uuid, uuid, text, text) TO anon, authenticated;

-- 4) Hide reservation_token / reserved_by from anonymous readers (column-level grants)
REVOKE SELECT ON public.campaign_numbers FROM anon;
GRANT SELECT (id, campaign_id, number, status, reserved_until, purchase_id, created_at, updated_at)
  ON public.campaign_numbers TO anon;