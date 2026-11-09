-- ============================================================
-- Fase 3 / Grupo 1 — Cadastros base (Master Data)
-- ============================================================

-- Helper: shared updated_at trigger already exists (public.set_updated_at)

-- ---------- CUSTOMERS ----------
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'individual',
  cpf text,
  cnpj text,
  rg text,
  state_registration text,
  municipal_registration text,
  birth_date date,
  phone text,
  cellphone text,
  whatsapp text,
  email text,
  secondary_email text,
  website text,
  notes text,
  status text NOT NULL DEFAULT 'active',
  tags text[] NOT NULL DEFAULT '{}',
  classification text,
  fantasy_name text,
  company_name text,
  profession text,
  origin text,
  photo text,
  favorite boolean NOT NULL DEFAULT false,
  responsible_user_id uuid,
  addresses jsonb NOT NULL DEFAULT '[]'::jsonb,
  contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  custom_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  observations jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  warranties jsonb NOT NULL DEFAULT '[]'::jsonb,
  relationships jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- SUPPLIERS ----------
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  fantasy_name text,
  document text,
  type text NOT NULL DEFAULT 'legal',
  email text,
  phone text,
  cellphone text,
  website text,
  contact_name text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- MANUFACTURERS ----------
CREATE TABLE public.manufacturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  country text,
  website text,
  support_phone text,
  support_email text,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- BRANDS ----------
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  manufacturer_id uuid REFERENCES public.manufacturers(id) ON DELETE SET NULL,
  logo text,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- CATEGORIES ----------
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- EQUIPMENT TYPES ----------
CREATE TABLE public.equipment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- MODELS ----------
CREATE TABLE public.models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  code text,
  year integer,
  specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- WARRANTIES ----------
CREATE TABLE public.warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_days integer NOT NULL DEFAULT 90,
  type text,
  terms text,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- DEVICES ----------
CREATE TABLE public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  type text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  manufacturer_id uuid REFERENCES public.manufacturers(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  model_id uuid REFERENCES public.models(id) ON DELETE SET NULL,
  equipment_type_id uuid REFERENCES public.equipment_types(id) ON DELETE SET NULL,
  warranty_id uuid REFERENCES public.warranties(id) ON DELETE SET NULL,
  serial_number text,
  imei text,
  asset_number text,
  color text,
  voltage text,
  password text,
  condition text,
  purchase_date date,
  invoice_number text,
  manufacturer_warranty text,
  notes text,
  favorite boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  custom_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  checklist jsonb,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  accessories jsonb NOT NULL DEFAULT '[]'::jsonb,
  device_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  transfers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- DEFECTS ----------
CREATE TABLE public.defects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  severity text,
  description text,
  solution text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- MEASUREMENT UNITS ----------
CREATE TABLE public.measurement_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  abbreviation text NOT NULL,
  category text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- SERVICES ----------
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text,
  price numeric(14,2) NOT NULL DEFAULT 0,
  cost numeric(14,2) NOT NULL DEFAULT 0,
  estimated_time integer,
  warranty_id uuid REFERENCES public.warranties(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- PARTS ----------
CREATE TABLE public.parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  barcode text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  measurement_unit_id uuid REFERENCES public.measurement_units(id) ON DELETE SET NULL,
  description text,
  cost_price numeric(14,2) NOT NULL DEFAULT 0,
  sale_price numeric(14,2) NOT NULL DEFAULT 0,
  stock_quantity numeric(14,3) NOT NULL DEFAULT 0,
  min_stock numeric(14,3) NOT NULL DEFAULT 0,
  location text,
  warranty_id uuid REFERENCES public.warranties(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- PAYMENT METHODS ----------
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  type text,
  fee_percent numeric(6,3) NOT NULL DEFAULT 0,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- PAYMENT TERMS ----------
CREATE TABLE public.payment_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  installments integer NOT NULL DEFAULT 1,
  interval_days integer NOT NULL DEFAULT 30,
  first_due_days integer NOT NULL DEFAULT 30,
  interest_percent numeric(6,3) NOT NULL DEFAULT 0,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- TECHNICIANS ----------
CREATE TABLE public.technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid,
  name text NOT NULL,
  document text,
  email text,
  phone text,
  cellphone text,
  role text,
  specialties text[] NOT NULL DEFAULT '{}',
  certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  hire_date date,
  hourly_rate numeric(14,2) NOT NULL DEFAULT 0,
  commission_rate numeric(6,3) NOT NULL DEFAULT 0,
  notes text,
  photo text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ============================================================
-- GRANTS + RLS + POLICIES + TRIGGERS + INDEXES
-- ============================================================
DO $$
DECLARE t text;
DECLARE tables text[] := ARRAY[
  'customers','suppliers','manufacturers','brands','categories','equipment_types',
  'models','warranties','devices','defects','measurement_units','services','parts',
  'payment_methods','payment_terms','technicians'
];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format($f$CREATE POLICY "%1$s members read" ON public.%1$I
      FOR SELECT TO authenticated
      USING (public.has_company_access(auth.uid(), company_id))$f$, t);

    EXECUTE format($f$CREATE POLICY "%1$s members insert" ON public.%1$I
      FOR INSERT TO authenticated
      WITH CHECK (public.has_company_access(auth.uid(), company_id))$f$, t);

    EXECUTE format($f$CREATE POLICY "%1$s members update" ON public.%1$I
      FOR UPDATE TO authenticated
      USING (public.has_company_access(auth.uid(), company_id))
      WITH CHECK (public.has_company_access(auth.uid(), company_id))$f$, t);

    EXECUTE format($f$CREATE POLICY "%1$s members delete" ON public.%1$I
      FOR DELETE TO authenticated
      USING (public.has_company_access(auth.uid(), company_id))$f$, t);

    EXECUTE format('CREATE TRIGGER set_%1$s_updated_at BEFORE UPDATE ON public.%1$I
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);

    EXECUTE format('CREATE INDEX idx_%1$s_company ON public.%1$I (company_id)', t);
    EXECUTE format('CREATE INDEX idx_%1$s_deleted ON public.%1$I (deleted_at)', t);
  END LOOP;
END $$;

CREATE INDEX idx_customers_name ON public.customers (name);
CREATE INDEX idx_customers_email ON public.customers (email);
CREATE INDEX idx_devices_customer ON public.devices (customer_id);
CREATE INDEX idx_devices_serial ON public.devices (serial_number);
CREATE INDEX idx_parts_code ON public.parts (code);
CREATE INDEX idx_services_code ON public.services (code);
