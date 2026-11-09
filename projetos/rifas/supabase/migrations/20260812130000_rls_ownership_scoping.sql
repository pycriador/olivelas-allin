-- =============================================================================
-- RLS Ownership Scoping
-- Cada usuario (principalmente PUBLISHER / Criador) so enxerga e gerencia o que
-- criou. GLOBAL_ADMIN e ADMIN continuam vendo/gerenciando tudo.
-- Corrige a divergencia entre o modelo novo (profiles.role_id -> roles.code)
-- e o legado (user_roles) usado por is_global_admin(), que deixava Criadores
-- enxergando os registros do Global Admin.
-- =============================================================================

-- 1. Helper: usuario atual tem papel administrativo (GLOBAL_ADMIN ou ADMIN).
--    Le do modelo novo com fallback para o legado (user_roles so tem
--    GLOBAL_ADMIN/USER no enum app_role).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role_code(auth.uid()) IN ('GLOBAL_ADMIN', 'ADMIN')
      OR public.has_role(auth.uid(), 'GLOBAL_ADMIN'::public.app_role);
$$;

-- 2. Helper: pode gerenciar uma campanha (admin ou dono).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_campaign(p_campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_user()
      OR EXISTS (
        SELECT 1 FROM public.campaigns c
        WHERE c.id = p_campaign_id AND c.created_by = auth.uid()
      );
$$;

-- 3. Helper: pode gerenciar um pedido (admin ou dono da campanha do pedido).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_user()
      OR EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.campaigns c ON c.id = o.campaign_id
        WHERE o.id = p_order_id AND c.created_by = auth.uid()
      );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.can_manage_campaign(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_campaign(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.can_manage_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_order(uuid) TO authenticated, service_role;

-- =============================================================================
-- 4. campaigns
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins read all campaigns" ON public.campaigns;
CREATE POLICY "Admins read all campaigns" ON public.campaigns
  FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "Owners read own campaigns" ON public.campaigns;
CREATE POLICY "Owners read own campaigns" ON public.campaigns
  FOR SELECT TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Admins create campaigns" ON public.campaigns;
CREATE POLICY "Admins create campaigns" ON public.campaigns
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Owners create own campaigns" ON public.campaigns;
CREATE POLICY "Owners create own campaigns" ON public.campaigns
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Admins update all campaigns" ON public.campaigns;
CREATE POLICY "Admins update all campaigns" ON public.campaigns
  FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Owners update own campaigns" ON public.campaigns;
CREATE POLICY "Owners update own campaigns" ON public.campaigns
  FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Admins delete all campaigns" ON public.campaigns;
CREATE POLICY "Admins delete all campaigns" ON public.campaigns
  FOR DELETE TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "Owners delete own campaigns" ON public.campaigns;
CREATE POLICY "Owners delete own campaigns" ON public.campaigns
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- =============================================================================
-- 5. campaign_images / campaign_settings (por dono da campanha)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage campaign images" ON public.campaign_images;
CREATE POLICY "Admins manage campaign images" ON public.campaign_images
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
DROP POLICY IF EXISTS "Owners manage campaign images" ON public.campaign_images;
CREATE POLICY "Owners manage campaign images" ON public.campaign_images
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_images.campaign_id AND c.created_by = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_images.campaign_id AND c.created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage campaign settings" ON public.campaign_settings;
CREATE POLICY "Admins manage campaign settings" ON public.campaign_settings
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
DROP POLICY IF EXISTS "Owners manage campaign settings" ON public.campaign_settings;
CREATE POLICY "Owners manage campaign settings" ON public.campaign_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_settings.campaign_id AND c.created_by = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_settings.campaign_id AND c.created_by = auth.uid())
  );

-- =============================================================================
-- 6. campaign_numbers (leitura: admin ou dono da campanha; escrita via RPCs)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins read campaign numbers" ON public.campaign_numbers;
DROP POLICY IF EXISTS "Admins manage campaign numbers" ON public.campaign_numbers;

CREATE POLICY "Admins read campaign numbers" ON public.campaign_numbers
  FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "Owners read campaign numbers" ON public.campaign_numbers;
CREATE POLICY "Owners read campaign numbers" ON public.campaign_numbers
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_numbers.campaign_id AND c.created_by = auth.uid())
  );

CREATE POLICY "Admins manage campaign numbers" ON public.campaign_numbers
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- =============================================================================
-- 7. orders (leitura: admin ou dono da campanha do pedido)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins read orders" ON public.orders;
CREATE POLICY "Admins read orders" ON public.orders
  FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "Owners read orders" ON public.orders;
CREATE POLICY "Owners read orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.campaigns c
            WHERE c.id = orders.campaign_id AND c.created_by = auth.uid())
  );

-- =============================================================================
-- 8. order_items / order_receipts
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins read order items" ON public.order_items;
CREATE POLICY "Admins read order items" ON public.order_items
  FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "Owners read order items" ON public.order_items;
CREATE POLICY "Owners read order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.campaigns c
            WHERE c.id = order_items.campaign_id AND c.created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Admins read order receipts" ON public.order_receipts;
CREATE POLICY "Admins read order receipts" ON public.order_receipts
  FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "Owners read order receipts" ON public.order_receipts;
CREATE POLICY "Owners read order receipts" ON public.order_receipts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.campaigns c ON c.id = oi.campaign_id
      WHERE oi.order_id = order_receipts.order_id AND c.created_by = auth.uid()
    )
  );

-- =============================================================================
-- 9. customers (leitura: admin ou dono de campanha com pedido do cliente)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins read customers" ON public.customers;
CREATE POLICY "Admins read customers" ON public.customers
  FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "Owners read customers" ON public.customers;
CREATE POLICY "Owners read customers" ON public.customers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.campaigns c ON c.id = o.campaign_id
      WHERE o.customer_id = customers.id AND c.created_by = auth.uid()
    )
  );

-- =============================================================================
-- 10. Storage: bucket "campaign-media" (admin ou dono da campanha)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins read campaign media objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins insert campaign media objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins update campaign media objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete campaign media objects" ON storage.objects;

CREATE POLICY "Admins read campaign media objects" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'campaign-media' AND (storage.foldername(name))[1] = 'campaigns' AND public.is_admin_user());

DROP POLICY IF EXISTS "Owners read campaign media objects" ON storage.objects;
CREATE POLICY "Owners read campaign media objects" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'campaign-media'
    AND (storage.foldername(name))[1] = 'campaigns'
    AND EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = ((storage.foldername(name))[2])::uuid AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins insert campaign media objects" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'campaign-media' AND (storage.foldername(name))[1] = 'campaigns' AND public.is_admin_user());

DROP POLICY IF EXISTS "Owners insert campaign media objects" ON storage.objects;
CREATE POLICY "Owners insert campaign media objects" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-media'
    AND (storage.foldername(name))[1] = 'campaigns'
    AND EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = ((storage.foldername(name))[2])::uuid AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins update campaign media objects" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'campaign-media' AND (storage.foldername(name))[1] = 'campaigns' AND public.is_admin_user())
  WITH CHECK (bucket_id = 'campaign-media' AND (storage.foldername(name))[1] = 'campaigns' AND public.is_admin_user());

DROP POLICY IF EXISTS "Owners update campaign media objects" ON storage.objects;
CREATE POLICY "Owners update campaign media objects" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'campaign-media'
    AND (storage.foldername(name))[1] = 'campaigns'
    AND EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = ((storage.foldername(name))[2])::uuid AND c.created_by = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'campaign-media'
    AND (storage.foldername(name))[1] = 'campaigns'
    AND EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = ((storage.foldername(name))[2])::uuid AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins delete campaign media objects" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'campaign-media' AND (storage.foldername(name))[1] = 'campaigns' AND public.is_admin_user());

DROP POLICY IF EXISTS "Owners delete campaign media objects" ON storage.objects;
CREATE POLICY "Owners delete campaign media objects" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'campaign-media'
    AND (storage.foldername(name))[1] = 'campaigns'
    AND EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = ((storage.foldername(name))[2])::uuid AND c.created_by = auth.uid()
    )
  );

-- =============================================================================
-- 11. RPCs: permissoes por dono-campanha (admin ou dono), em vez do legado
--     is_global_admin() que nao reconhece o modelo novo de roles.
-- ---------------------------------------------------------------------------

-- create_manual_order
CREATE OR REPLACE FUNCTION public.create_manual_order(
  p_campaign_id UUID,
  p_customer_id UUID,
  p_payment_method public.payment_method,
  p_discount NUMERIC,
  p_notes TEXT,
  p_numbers BIGINT[],
  p_initial_status public.order_status DEFAULT 'OPEN'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign_row public.campaigns%ROWTYPE;
  order_row public.orders%ROWTYPE;
  actor_id UUID := auth.uid();
  conflicts BIGINT[];
  out_of_range BIGINT[];
  item_total NUMERIC(12, 2);
  total_count INTEGER;
  number_status public.campaign_number_status;
BEGIN
  IF actor_id IS NULL OR NOT public.can_manage_campaign(p_campaign_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT * INTO campaign_row
  FROM public.campaigns
  WHERE id = p_campaign_id AND deleted_at IS NULL;
  IF campaign_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CAMPAIGN_NOT_FOUND');
  END IF;

  IF p_numbers IS NULL OR array_length(p_numbers, 1) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_NUMBERS');
  END IF;

  IF p_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CUSTOMER_NOT_FOUND');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rafflehub_orders'), hashtext(p_campaign_id::text));

  SELECT array_agg(DISTINCT x.n ORDER BY x.n) INTO p_numbers FROM unnest(p_numbers) AS x(n);
  SELECT count(*) INTO total_count FROM unnest(p_numbers) AS x(n);

  SELECT array_agg(x.n ORDER BY x.n) INTO out_of_range
  FROM unnest(p_numbers) AS x(n)
  WHERE x.n < campaign_row.number_start OR x.n > campaign_row.number_end;
  IF out_of_range IS NOT NULL AND array_length(out_of_range, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NUMBER_OUT_OF_RANGE', 'numbers', out_of_range);
  END IF;

  SELECT array_agg(n.number ORDER BY n.number) INTO conflicts
  FROM public.campaign_numbers n
  WHERE n.campaign_id = p_campaign_id AND n.number = ANY(p_numbers)
    AND (
      n.status IN ('PAID', 'BLOCKED', 'WINNER', 'CANCELLED')
      OR (n.status IN ('RESERVED', 'PENDING_PAYMENT') AND n.reserved_until > now())
    );
  IF conflicts IS NOT NULL AND array_length(conflicts, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CONFLICT', 'numbers', conflicts);
  END IF;

  DELETE FROM public.campaign_numbers
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND status IN ('RESERVED', 'PENDING_PAYMENT')
    AND (reserved_until IS NULL OR reserved_until <= now());

  item_total := total_count * campaign_row.price_per_number;
  IF p_discount IS NULL OR p_discount < 0 THEN p_discount := 0; END IF;

  number_status := CASE p_initial_status
    WHEN 'PAID' THEN 'PAID'::public.campaign_number_status
    WHEN 'WAITING_PAYMENT' THEN 'PENDING_PAYMENT'::public.campaign_number_status
    ELSE 'RESERVED'::public.campaign_number_status
  END;

  INSERT INTO public.orders (
    campaign_id, customer_id, source, status, payment_method, subtotal, discount, total, notes, created_by
  )
  VALUES (
    p_campaign_id, p_customer_id, 'MANUAL'::public.order_source, p_initial_status,
    p_payment_method, item_total, p_discount, GREATEST(0, item_total - p_discount), p_notes, actor_id
  )
  RETURNING * INTO order_row;

  INSERT INTO public.order_items (order_id, campaign_id, number, unit_price, status)
  SELECT order_row.id, p_campaign_id, x.n, campaign_row.price_per_number, number_status
  FROM unnest(p_numbers) AS x(n);

  INSERT INTO public.campaign_numbers (campaign_id, number, status, reserved_by, purchase_id)
  SELECT p_campaign_id, x.n, number_status, actor_id, order_row.id
  FROM unnest(p_numbers) AS x(n);

  PERFORM public.log_order_audit('ORDER_CREATED', order_row.id, p_campaign_id, actor_id,
    jsonb_build_object('source', 'MANUAL', 'numbers', p_numbers, 'count', total_count,
      'subtotal', item_total, 'discount', p_discount, 'total', order_row.total,
      'initial_status', p_initial_status));

  RETURN jsonb_build_object(
    'ok', true, 'order_id', order_row.id, 'status', order_row.status,
    'numbers', p_numbers, 'count', total_count
  );
END; $$;

-- add_order_numbers
CREATE OR REPLACE FUNCTION public.add_order_numbers(
  p_order_id UUID,
  p_numbers BIGINT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row public.orders%ROWTYPE;
  campaign_row public.campaigns%ROWTYPE;
  actor_id UUID := auth.uid();
  conflicts BIGINT[];
  out_of_range BIGINT[];
  status_for_number public.campaign_number_status;
  item_total NUMERIC(12, 2);
  total_count INTEGER;
BEGIN
  IF actor_id IS NULL OR NOT public.can_manage_order(p_order_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT * INTO order_row FROM public.orders WHERE id = p_order_id;
  IF order_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ORDER_NOT_FOUND');
  END IF;
  IF order_row.status NOT IN ('OPEN', 'WAITING_CONTACT', 'WAITING_PAYMENT') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ORDER_LOCKED');
  END IF;
  IF p_numbers IS NULL OR array_length(p_numbers, 1) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_NUMBERS');
  END IF;

  SELECT * INTO campaign_row FROM public.campaigns WHERE id = order_row.campaign_id;
  PERFORM pg_advisory_xact_lock(hashtext('rafflehub_orders'), hashtext(order_row.campaign_id::text));

  SELECT array_agg(DISTINCT x.n ORDER BY x.n) INTO p_numbers FROM unnest(p_numbers) AS x(n);
  SELECT count(*) INTO total_count FROM unnest(p_numbers) AS x(n);

  SELECT array_agg(x.n ORDER BY x.n) INTO out_of_range
  FROM unnest(p_numbers) AS x(n)
  WHERE x.n < campaign_row.number_start OR x.n > campaign_row.number_end;
  IF out_of_range IS NOT NULL AND array_length(out_of_range, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NUMBER_OUT_OF_RANGE', 'numbers', out_of_range);
  END IF;

  SELECT array_agg(n.number ORDER BY n.number) INTO conflicts
  FROM public.campaign_numbers n
  WHERE n.campaign_id = order_row.campaign_id AND n.number = ANY(p_numbers)
    AND (
      n.status IN ('PAID', 'BLOCKED', 'WINNER', 'CANCELLED')
      OR (n.status IN ('RESERVED', 'PENDING_PAYMENT') AND n.reserved_until > now())
    );
  IF conflicts IS NOT NULL AND array_length(conflicts, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CONFLICT', 'numbers', conflicts);
  END IF;

  DELETE FROM public.campaign_numbers
  WHERE campaign_id = order_row.campaign_id
    AND number = ANY(p_numbers)
    AND status IN ('RESERVED', 'PENDING_PAYMENT')
    AND (reserved_until IS NULL OR reserved_until <= now());

  status_for_number := CASE order_row.status
    WHEN 'WAITING_PAYMENT' THEN 'PENDING_PAYMENT'::public.campaign_number_status
    ELSE 'RESERVED'::public.campaign_number_status
  END;

  INSERT INTO public.order_items (order_id, campaign_id, number, unit_price, status)
  SELECT p_order_id, order_row.campaign_id, x.n, campaign_row.price_per_number, status_for_number
  FROM unnest(p_numbers) AS x(n);

  INSERT INTO public.campaign_numbers (campaign_id, number, status, reserved_by, purchase_id)
  SELECT order_row.campaign_id, x.n, status_for_number, order_row.created_by, p_order_id
  FROM unnest(p_numbers) AS x(n);

  SELECT count(*) * campaign_row.price_per_number INTO item_total
  FROM public.order_items WHERE order_id = p_order_id;

  UPDATE public.orders
  SET subtotal = item_total, total = GREATEST(0, item_total - discount)
  WHERE id = p_order_id;

  PERFORM public.log_order_audit('ORDER_NUMBER_ADDED', p_order_id, order_row.campaign_id, actor_id,
    jsonb_build_object('numbers', p_numbers, 'count', total_count));

  RETURN jsonb_build_object('ok', true, 'order_id', p_order_id, 'numbers', p_numbers, 'count', total_count);
END; $$;

-- remove_order_numbers
CREATE OR REPLACE FUNCTION public.remove_order_numbers(
  p_order_id UUID,
  p_numbers BIGINT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row public.orders%ROWTYPE;
  campaign_row public.campaigns%ROWTYPE;
  actor_id UUID := auth.uid();
  invalid BIGINT[];
  item_total NUMERIC(12, 2);
  total_count INTEGER;
BEGIN
  IF actor_id IS NULL OR NOT public.can_manage_order(p_order_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT * INTO order_row FROM public.orders WHERE id = p_order_id;
  IF order_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ORDER_NOT_FOUND');
  END IF;
  IF order_row.status NOT IN ('OPEN', 'WAITING_CONTACT', 'WAITING_PAYMENT') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ORDER_LOCKED');
  END IF;
  IF p_numbers IS NULL OR array_length(p_numbers, 1) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_NUMBERS');
  END IF;

  SELECT * INTO campaign_row FROM public.campaigns WHERE id = order_row.campaign_id;
  PERFORM pg_advisory_xact_lock(hashtext('rafflehub_orders'), hashtext(order_row.campaign_id::text));

  SELECT array_agg(x.n ORDER BY x.n) INTO invalid
  FROM unnest(p_numbers) AS x(n)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.order_items oi
    WHERE oi.order_id = p_order_id AND oi.number = x.n
  );
  IF invalid IS NOT NULL AND array_length(invalid, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NUMBER_NOT_IN_ORDER', 'numbers', invalid);
  END IF;

  SELECT count(*) INTO total_count
  FROM public.order_items WHERE order_id = p_order_id AND number = ANY(p_numbers);

  DELETE FROM public.order_items
  WHERE order_id = p_order_id AND number = ANY(p_numbers);

  DELETE FROM public.campaign_numbers
  WHERE campaign_id = order_row.campaign_id AND purchase_id = p_order_id AND number = ANY(p_numbers);

  SELECT count(*) * campaign_row.price_per_number INTO item_total
  FROM public.order_items WHERE order_id = p_order_id;

  UPDATE public.orders
  SET subtotal = item_total, total = GREATEST(0, item_total - discount)
  WHERE id = p_order_id;

  PERFORM public.log_order_audit('ORDER_NUMBER_REMOVED', p_order_id, order_row.campaign_id, actor_id,
    jsonb_build_object('numbers', p_numbers, 'count', total_count));

  RETURN jsonb_build_object('ok', true, 'order_id', p_order_id, 'numbers', p_numbers, 'count', total_count);
END; $$;

-- swap_order_number
CREATE OR REPLACE FUNCTION public.swap_order_number(
  p_order_id UUID,
  p_old_number BIGINT,
  p_new_number BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row public.orders%ROWTYPE;
  campaign_row public.campaigns%ROWTYPE;
  actor_id UUID := auth.uid();
  status_for_number public.campaign_number_status;
  conflict_count INTEGER;
  old_in_order INTEGER;
BEGIN
  IF actor_id IS NULL OR NOT public.can_manage_order(p_order_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT * INTO order_row FROM public.orders WHERE id = p_order_id;
  IF order_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ORDER_NOT_FOUND');
  END IF;
  IF order_row.status NOT IN ('OPEN', 'WAITING_CONTACT', 'WAITING_PAYMENT') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ORDER_LOCKED');
  END IF;

  SELECT * INTO campaign_row FROM public.campaigns WHERE id = order_row.campaign_id;
  IF p_new_number < campaign_row.number_start OR p_new_number > campaign_row.number_end THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NUMBER_OUT_OF_RANGE');
  END IF;
  IF p_old_number = p_new_number THEN
    RETURN jsonb_build_object('ok', false, 'error', 'SAME_NUMBER');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rafflehub_orders'), hashtext(order_row.campaign_id::text));

  SELECT count(*) INTO old_in_order
  FROM public.order_items WHERE order_id = p_order_id AND number = p_old_number;
  IF old_in_order = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NUMBER_NOT_IN_ORDER');
  END IF;

  SELECT count(*) INTO conflict_count
  FROM public.campaign_numbers
  WHERE campaign_id = order_row.campaign_id AND number = p_new_number;
  IF conflict_count > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CONFLICT');
  END IF;

  DELETE FROM public.order_items WHERE order_id = p_order_id AND number = p_old_number;
  DELETE FROM public.campaign_numbers
  WHERE campaign_id = order_row.campaign_id AND purchase_id = p_order_id AND number = p_old_number;

  status_for_number := CASE order_row.status
    WHEN 'WAITING_PAYMENT' THEN 'PENDING_PAYMENT'::public.campaign_number_status
    ELSE 'RESERVED'::public.campaign_number_status
  END;

  INSERT INTO public.order_items (order_id, campaign_id, number, unit_price, status)
  VALUES (p_order_id, order_row.campaign_id, p_new_number, campaign_row.price_per_number, status_for_number);

  INSERT INTO public.campaign_numbers (campaign_id, number, status, reserved_by, purchase_id)
  VALUES (order_row.campaign_id, p_new_number, status_for_number, order_row.created_by, p_order_id);

  PERFORM public.log_order_audit('ORDER_NUMBER_SWAPPED', p_order_id, order_row.campaign_id, actor_id,
    jsonb_build_object('from', p_old_number, 'to', p_new_number));

  RETURN jsonb_build_object('ok', true, 'order_id', p_order_id, 'from', p_old_number, 'to', p_new_number);
END; $$;

-- set_order_status
CREATE OR REPLACE FUNCTION public.set_order_status(
  p_order_id UUID,
  p_status public.order_status
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row public.orders%ROWTYPE;
  actor_id UUID := auth.uid();
  numbers BIGINT[];
  audit_action TEXT;
BEGIN
  IF actor_id IS NULL OR NOT public.can_manage_order(p_order_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT * INTO order_row FROM public.orders WHERE id = p_order_id;
  IF order_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ORDER_NOT_FOUND');
  END IF;

  IF order_row.status = p_status THEN
    RETURN jsonb_build_object('ok', true, 'order_id', p_order_id, 'status', p_status, 'unchanged', true);
  END IF;

  IF NOT (
    (order_row.status = 'OPEN' AND p_status IN ('WAITING_CONTACT', 'WAITING_PAYMENT', 'CANCELLED', 'EXPIRED'))
    OR (order_row.status = 'WAITING_CONTACT' AND p_status IN ('OPEN', 'WAITING_PAYMENT', 'CANCELLED', 'EXPIRED'))
    OR (order_row.status = 'WAITING_PAYMENT' AND p_status IN ('OPEN', 'WAITING_CONTACT', 'PAID', 'CANCELLED', 'EXPIRED'))
    OR (order_row.status = 'PAID' AND p_status IN ('REFUNDED', 'CANCELLED'))
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_TRANSITION',
      'from', order_row.status, 'to', p_status);
  END IF;

  SELECT array_agg(number ORDER BY number) INTO numbers
  FROM public.order_items WHERE order_id = p_order_id;

  IF p_status IN ('CANCELLED', 'EXPIRED', 'REFUNDED') THEN
    DELETE FROM public.campaign_numbers
    WHERE campaign_id = order_row.campaign_id AND purchase_id = p_order_id AND number = ANY(numbers);
  ELSIF p_status = 'PAID' THEN
    UPDATE public.campaign_numbers
    SET status = 'PAID'::public.campaign_number_status, reserved_until = NULL
    WHERE campaign_id = order_row.campaign_id AND purchase_id = p_order_id AND number = ANY(numbers);
    UPDATE public.order_items SET status = 'PAID'::public.campaign_number_status WHERE order_id = p_order_id;
  ELSIF p_status = 'WAITING_PAYMENT' THEN
    UPDATE public.campaign_numbers
    SET status = 'PENDING_PAYMENT'::public.campaign_number_status
    WHERE campaign_id = order_row.campaign_id AND purchase_id = p_order_id AND number = ANY(numbers);
    UPDATE public.order_items SET status = 'PENDING_PAYMENT'::public.campaign_number_status WHERE order_id = p_order_id;
  ELSE
    UPDATE public.campaign_numbers
    SET status = 'RESERVED'::public.campaign_number_status
    WHERE campaign_id = order_row.campaign_id AND purchase_id = p_order_id AND number = ANY(numbers);
    UPDATE public.order_items SET status = 'RESERVED'::public.campaign_number_status WHERE order_id = p_order_id;
  END IF;

  UPDATE public.orders SET status = p_status WHERE id = p_order_id;

  audit_action := CASE
    WHEN p_status = 'PAID' THEN 'ORDER_PAYMENT_CONFIRMED'
    WHEN p_status = 'REFUNDED' THEN 'ORDER_REFUNDED'
    WHEN p_status = 'CANCELLED' THEN 'ORDER_CANCELLED'
    WHEN p_status = 'EXPIRED' THEN 'ORDER_EXPIRED'
    ELSE 'ORDER_STATUS_CHANGED'
  END;

  PERFORM public.log_order_audit(audit_action, p_order_id, order_row.campaign_id, actor_id,
    jsonb_build_object('from', order_row.status, 'to', p_status, 'numbers', numbers));

  RETURN jsonb_build_object('ok', true, 'order_id', p_order_id, 'status', p_status, 'from', order_row.status);
END; $$;

-- import_sold_numbers
CREATE OR REPLACE FUNCTION public.import_sold_numbers(
  p_campaign_id UUID,
  p_customer_id UUID,
  p_payment_method public.payment_method,
  p_notes TEXT,
  p_numbers BIGINT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign_row public.campaigns%ROWTYPE;
  order_row public.orders%ROWTYPE;
  actor_id UUID := auth.uid();
  conflicts BIGINT[];
  out_of_range BIGINT[];
  item_total NUMERIC(12, 2);
  total_count INTEGER;
BEGIN
  IF actor_id IS NULL OR NOT public.can_manage_campaign(p_campaign_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT * INTO campaign_row
  FROM public.campaigns WHERE id = p_campaign_id AND deleted_at IS NULL;
  IF campaign_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CAMPAIGN_NOT_FOUND');
  END IF;
  IF p_numbers IS NULL OR array_length(p_numbers, 1) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_NUMBERS');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rafflehub_orders'), hashtext(p_campaign_id::text));

  SELECT array_agg(DISTINCT x.n ORDER BY x.n) INTO p_numbers FROM unnest(p_numbers) AS x(n);
  SELECT count(*) INTO total_count FROM unnest(p_numbers) AS x(n);

  SELECT array_agg(x.n ORDER BY x.n) INTO out_of_range
  FROM unnest(p_numbers) AS x(n)
  WHERE x.n < campaign_row.number_start OR x.n > campaign_row.number_end;
  IF out_of_range IS NOT NULL AND array_length(out_of_range, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NUMBER_OUT_OF_RANGE', 'numbers', out_of_range);
  END IF;

  SELECT array_agg(n.number ORDER BY n.number) INTO conflicts
  FROM public.campaign_numbers n
  WHERE n.campaign_id = p_campaign_id AND n.number = ANY(p_numbers);
  IF conflicts IS NOT NULL AND array_length(conflicts, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CONFLICT', 'numbers', conflicts);
  END IF;

  item_total := total_count * campaign_row.price_per_number;

  INSERT INTO public.orders (
    campaign_id, customer_id, source, status, payment_method, subtotal, discount, total, notes, created_by
  )
  VALUES (
    p_campaign_id, p_customer_id, 'MANUAL'::public.order_source, 'PAID'::public.order_status,
    p_payment_method, item_total, 0, item_total, COALESCE(p_notes, 'Importação em lote de números vendidos.'), actor_id
  )
  RETURNING * INTO order_row;

  INSERT INTO public.order_items (order_id, campaign_id, number, unit_price, status)
  SELECT order_row.id, p_campaign_id, x.n, campaign_row.price_per_number,
         'PAID'::public.campaign_number_status
  FROM unnest(p_numbers) AS x(n);

  INSERT INTO public.campaign_numbers (campaign_id, number, status, reserved_by, purchase_id)
  SELECT p_campaign_id, x.n, 'PAID'::public.campaign_number_status, actor_id, order_row.id
  FROM unnest(p_numbers) AS x(n);

  PERFORM public.log_order_audit('ORDER_NUMBER_IMPORTED', order_row.id, p_campaign_id, actor_id,
    jsonb_build_object('numbers', p_numbers, 'count', total_count, 'total', item_total));

  RETURN jsonb_build_object(
    'ok', true, 'order_id', order_row.id, 'status', order_row.status,
    'numbers', p_numbers, 'count', total_count
  );
END; $$;

-- admin_manage_number
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
  IF actor_id IS NULL OR NOT public.can_manage_campaign(p_campaign_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT * INTO existing_row
  FROM public.campaign_numbers
  WHERE campaign_id = p_campaign_id AND number = p_number;

  IF existing_row.id IS NULL AND p_new_status = 'AVAILABLE' THEN
    RETURN jsonb_build_object('ok', true, 'unchanged', true);
  END IF;

  IF p_new_status = 'AVAILABLE' THEN
    IF existing_row.purchase_id IS NOT NULL THEN
      order_row_id := existing_row.purchase_id;
      DELETE FROM public.campaign_numbers
      WHERE campaign_id = p_campaign_id AND id = existing_row.id;

      PERFORM public.log_order_audit('ORDER_NUMBER_REMOVED', order_row_id, p_campaign_id, actor_id,
        jsonb_build_object('numbers', ARRAY[p_number], 'removed_by_admin', true));
    ELSE
      DELETE FROM public.campaign_numbers
      WHERE campaign_id = p_campaign_id AND id = existing_row.id;
    END IF;
  ELSIF existing_row.id IS NULL THEN
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

-- =============================================================================
-- 12. Grants dos RPCs (reforco)
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.create_manual_order(uuid, uuid, public.payment_method, numeric, text, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_manual_order(uuid, uuid, public.payment_method, numeric, text, bigint[], public.order_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_order_numbers(uuid, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_order_numbers(uuid, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.swap_order_number(uuid, bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_order_status(uuid, public.order_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_sold_numbers(uuid, uuid, public.payment_method, text, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_manage_number(uuid, bigint, public.campaign_number_status) TO authenticated;
