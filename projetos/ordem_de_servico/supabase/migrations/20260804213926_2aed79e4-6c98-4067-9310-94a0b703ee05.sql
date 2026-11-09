-- ============ Grupo 2: Service Orders ============

CREATE TABLE public.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  number text NOT NULL,
  customer_id uuid REFERENCES public.customers(id),
  customer_name text NOT NULL DEFAULT '',
  device_id uuid REFERENCES public.devices(id),
  device_info text,
  technician_id uuid REFERENCES public.technicians(id),
  technician_name text,
  category_id uuid REFERENCES public.categories(id),
  defect_id uuid REFERENCES public.defects(id),
  defect_name text,
  description text NOT NULL DEFAULT '',
  diagnosis text,
  notes text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  status_label text NOT NULL DEFAULT '',
  warranty_id uuid REFERENCES public.warranties(id),
  entry_date timestamptz NOT NULL DEFAULT now(),
  deadline timestamptz,
  delivery_date timestamptz,
  estimated_value numeric NOT NULL DEFAULT 0,
  final_value numeric NOT NULL DEFAULT 0,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  communications jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  pinned boolean NOT NULL DEFAULT false,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE public.so_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  current_version integer NOT NULL DEFAULT 1,
  revisions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.so_checklist_templates(id),
  template_name text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_at timestamptz,
  completed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_execution_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  responsible_id uuid,
  responsible_name text,
  date date,
  time text,
  time_spent numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  notes text NOT NULL DEFAULT '',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_time_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES public.so_execution_activities(id) ON DELETE SET NULL,
  start_time timestamptz,
  pause_time timestamptz,
  resume_time timestamptz,
  completion_time timestamptz,
  total_time numeric NOT NULL DEFAULT 0,
  productive_time numeric NOT NULL DEFAULT 0,
  stopped_time numeric NOT NULL DEFAULT 0,
  awaiting_parts_time numeric NOT NULL DEFAULT 0,
  technician_id uuid,
  technician_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  number text NOT NULL DEFAULT '',
  date timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL DEFAULT '',
  reported_defect text NOT NULL DEFAULT '',
  diagnosis text NOT NULL DEFAULT '',
  solution text NOT NULL DEFAULT '',
  warranty_applied boolean NOT NULL DEFAULT false,
  charged boolean NOT NULL DEFAULT false,
  responsible_id uuid,
  responsible_name text,
  delivery_date timestamptz,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  return_id uuid REFERENCES public.so_returns(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'entry',
  file_url text NOT NULL,
  thumbnail_url text,
  caption text NOT NULL DEFAULT '',
  "order" integer NOT NULL DEFAULT 0,
  favorite boolean NOT NULL DEFAULT false,
  uploaded_by uuid,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  service_item_id uuid,
  return_id uuid REFERENCES public.so_returns(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'service',
  days integer NOT NULL DEFAULT 0,
  start_date date NOT NULL DEFAULT current_date,
  end_date date NOT NULL DEFAULT current_date,
  coverage text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  discount_total numeric NOT NULL DEFAULT 0,
  discount_type text NOT NULL DEFAULT 'percent',
  discount_reason text,
  discount_authorized_by text,
  markup_total numeric NOT NULL DEFAULT 0,
  taxes numeric NOT NULL DEFAULT 0,
  shipping numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  final_value numeric NOT NULL DEFAULT 0,
  validity_days integer NOT NULL DEFAULT 7,
  deadline timestamptz,
  warranty_description text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  approval_date timestamptz,
  approval_user text,
  rejection_reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  budget_id uuid REFERENCES public.so_budgets(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  viewed_at timestamptz,
  approved_at timestamptz,
  approved_by text,
  rejected_at timestamptz,
  rejected_by text,
  rejection_reason text,
  origin text NOT NULL DEFAULT 'portal',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  method text NOT NULL DEFAULT 'pix',
  method_label text NOT NULL DEFAULT '',
  value numeric NOT NULL DEFAULT 0,
  installments integer NOT NULL DEFAULT 1,
  installment_detail jsonb NOT NULL DEFAULT '[]'::jsonb,
  date date,
  time text,
  notes text,
  responsible text,
  status text NOT NULL DEFAULT 'pending',
  document_id uuid,
  receipt_url text,
  confirmed_at timestamptz,
  confirmed_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  responsable text NOT NULL DEFAULT '',
  date date,
  time text,
  exit_photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  signature_id uuid,
  documents_delivered jsonb NOT NULL DEFAULT '[]'::jsonb,
  warranty_delivered boolean NOT NULL DEFAULT false,
  payment_confirmed boolean NOT NULL DEFAULT false,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  delivery_id uuid REFERENCES public.so_deliveries(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'customer',
  signatory_name text NOT NULL DEFAULT '',
  signatory_id text,
  signature_data text NOT NULL DEFAULT '',
  collected_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'proof',
  document_id uuid,
  number text NOT NULL DEFAULT '',
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_financial_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text NOT NULL DEFAULT '',
  value numeric,
  previous_balance numeric,
  new_balance numeric,
  user_id uuid,
  user_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_portal_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  public_code text NOT NULL,
  hash text NOT NULL DEFAULT '',
  qr_data text NOT NULL DEFAULT '',
  public_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  status_label text NOT NULL DEFAULT '',
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  warranty text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_quality_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.so_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grants, RLS, policies, triggers, indexes
DO $$
DECLARE t text;
DECLARE tables text[] := ARRAY[
  'service_orders','so_diagnostics','so_checklist_templates','so_checklists',
  'so_execution_activities','so_time_tracking','so_returns','so_photos',
  'so_warranties','so_budgets','so_approvals','so_payments','so_deliveries',
  'so_signatures','so_receipts','so_financial_history','so_portal_access',
  'so_tests','so_quality_control','so_costs'
];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_company_access(auth.uid(), company_id))', t || '_select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_company_access(auth.uid(), company_id))', t || '_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.has_company_access(auth.uid(), company_id)) WITH CHECK (public.has_company_access(auth.uid(), company_id))', t || '_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_company_access(auth.uid(), company_id))', t || '_delete', t);
    EXECUTE format('CREATE INDEX %I ON public.%I (company_id)', 'idx_' || t || '_company', t);
    IF t <> 'service_orders' AND t <> 'so_checklist_templates' THEN
      EXECUTE format('CREATE INDEX %I ON public.%I (service_order_id)', 'idx_' || t || '_so', t);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=t AND c.column_name='updated_at') THEN
      EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', 'set_' || t || '_updated_at', t);
    END IF;
  END LOOP;
END $$;

CREATE UNIQUE INDEX idx_service_orders_number ON public.service_orders (company_id, number);
CREATE INDEX idx_service_orders_customer ON public.service_orders (customer_id);
CREATE INDEX idx_service_orders_status ON public.service_orders (status);
CREATE INDEX idx_service_orders_deleted ON public.service_orders (deleted_at);
CREATE UNIQUE INDEX idx_so_portal_access_code ON public.so_portal_access (public_code);