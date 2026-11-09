-- =============================================================================
-- Hotfix: Reverter bloqueio de acesso causado pelo Lovable
-- =============================================================================

-- 1. is_global_admin() e has_role() PRECISAM ser executaveis por authenticated
--    (sao usadas como check nas politicas RLS de TODAS as tabelas)
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_global_admin() TO authenticated;

-- 2. Restaurar SELECT completo em campaign_numbers para anon
--    (a pagina publica precisa ler reserved_by e reservation_token)
-- ---------------------------------------------------------------------------
GRANT SELECT ON TABLE public.campaign_numbers TO anon;

-- 3. Garantir que as RPCs de reserva/cancelamento funcionem para publico
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.reserve_campaign_numbers(uuid, bigint[], uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_campaign_reservation(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_whatsapp_order(uuid, uuid, uuid, text, text) TO anon, authenticated;

-- 4. Admin RPCs (mantem restrito a authenticated + service_role)
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.create_manual_order(uuid, uuid, public.payment_method, numeric, text, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_manual_order(uuid, uuid, public.payment_method, numeric, text, bigint[], public.order_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_manage_number(uuid, bigint, public.campaign_number_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_order_status(uuid, public.order_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_order_numbers(uuid, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_order_numbers(uuid, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.swap_order_number(uuid, bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_sold_numbers(uuid, uuid, public.payment_method, text, bigint[]) TO authenticated;
