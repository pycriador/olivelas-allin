-- =============================================================================
-- admin_manage_number — permite GLOBAL_ADMIN alterar status de um numero
-- diretamente pela grade visual (cancelar, bloquear, reservar, liberar)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.admin_manage_number(
  p_campaign_id UUID,
  p_number BIGINT,
  p_new_status public.campaign_number_status
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id UUID := auth.uid();
  existing_row public.campaign_numbers%ROWTYPE;
  order_row_id UUID;
BEGIN
  IF actor_id IS NULL OR NOT public.is_global_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT * INTO existing_row
  FROM public.campaign_numbers
  WHERE campaign_id = p_campaign_id AND number = p_number;

  IF existing_row.id IS NULL AND p_new_status = 'AVAILABLE' THEN
    RETURN jsonb_build_object('ok', true, 'unchanged', true);
  END IF;

  IF p_new_status = 'AVAILABLE' THEN
    -- Libera numero: se tem purchase_id, remove do pedido (remove_order_numbers)
    IF existing_row.purchase_id IS NOT NULL THEN
      order_row_id := existing_row.purchase_id;
      DELETE FROM public.campaign_numbers
      WHERE campaign_id = p_campaign_id AND id = existing_row.id;

      -- Se era o ultimo numero do pedido, nao cancela (admin decide depois)
      PERFORM public.log_order_audit('ORDER_NUMBER_REMOVED', order_row_id, p_campaign_id, actor_id,
        jsonb_build_object('numbers', ARRAY[p_number], 'removed_by_admin', true));
    ELSE
      DELETE FROM public.campaign_numbers
      WHERE campaign_id = p_campaign_id AND id = existing_row.id;
    END IF;
  ELSIF existing_row.id IS NULL THEN
    -- Numeros sem registro: insere novo estado (CANCELLED, BLOCKED, RESERVED, PAID)
    INSERT INTO public.campaign_numbers (campaign_id, number, status, reserved_by)
    VALUES (p_campaign_id, p_number, p_new_status, actor_id);
  ELSE
    UPDATE public.campaign_numbers
    SET status = p_new_status,
        reserved_until = CASE WHEN p_new_status IN ('CANCELLED', 'BLOCKED', 'PAID')
                              THEN NULL ELSE reserved_until END,
        purchase_id = CASE WHEN p_new_status IN ('CANCELLED', 'BLOCKED')
                            THEN NULL ELSE purchase_id END,
        reservation_token = CASE WHEN p_new_status IN ('CANCELLED', 'BLOCKED', 'PAID')
                                  THEN NULL ELSE reservation_token END
    WHERE id = existing_row.id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'number', p_number, 'status', p_new_status);
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_manage_number(UUID, BIGINT, public.campaign_number_status) TO authenticated;
