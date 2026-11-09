-- 1. Platform settings (single row)
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name text NOT NULL DEFAULT 'RaffleHub',
  platform_logo text,
  favicon text,
  default_language text NOT NULL DEFAULT 'pt-BR',
  default_timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  default_theme text NOT NULL DEFAULT 'system',
  primary_color text NOT NULL DEFAULT '#0f172a',
  secondary_color text NOT NULL DEFAULT '#f59e0b',
  footer_text text,
  privacy_policy text,
  terms_of_service text,
  support_email text,
  support_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read platform settings" ON public.platform_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert platform settings" ON public.platform_settings
  FOR INSERT TO authenticated WITH CHECK (is_global_admin());
CREATE POLICY "Admins update platform settings" ON public.platform_settings
  FOR UPDATE TO authenticated USING (is_global_admin()) WITH CHECK (is_global_admin());
CREATE POLICY "Admins delete platform settings" ON public.platform_settings
  FOR DELETE TO authenticated USING (is_global_admin());

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.platform_settings (platform_name) VALUES ('RaffleHub');

-- 2. Publication status enum
CREATE TYPE public.campaign_publish_status AS ENUM (
  'DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'PAUSED', 'FINISHED', 'ARCHIVED'
);

-- 3. Expand campaign_settings
ALTER TABLE public.campaign_settings
  ADD COLUMN IF NOT EXISTS show_progress_bar boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_percentage_sold boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_total_numbers boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_contact_information boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_statistics boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_gallery boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_product_description boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_purchase_counter boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_recent_buyers boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_rules boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_comments boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_faq boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_whatsapp boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_manual_selection boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_random_selection boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_reservation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reservation_timeout_minutes integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_numbers_per_purchase integer,
  ADD COLUMN IF NOT EXISTS publish_status public.campaign_publish_status NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS primary_color text,
  ADD COLUMN IF NOT EXISTS secondary_color text,
  ADD COLUMN IF NOT EXISTS button_color text,
  ADD COLUMN IF NOT EXISTS font_family text,
  ADD COLUMN IF NOT EXISTS background_image text,
  ADD COLUMN IF NOT EXISTS banner_image text,
  ADD COLUMN IF NOT EXISTS campaign_logo text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image text,
  ADD COLUMN IF NOT EXISTS twitter_title text,
  ADD COLUMN IF NOT EXISTS twitter_description text,
  ADD COLUMN IF NOT EXISTS twitter_image text,
  ADD COLUMN IF NOT EXISTS json_ld text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_hours text,
  ADD COLUMN IF NOT EXISTS contact_whatsapp text;

-- keep publish_status roughly in sync with existing campaign status
UPDATE public.campaign_settings cs
SET publish_status = CASE c.status
  WHEN 'ACTIVE' THEN 'PUBLISHED'::public.campaign_publish_status
  WHEN 'SCHEDULED' THEN 'PUBLISHED'::public.campaign_publish_status
  WHEN 'PAUSED' THEN 'PAUSED'::public.campaign_publish_status
  WHEN 'FINISHED' THEN 'FINISHED'::public.campaign_publish_status
  WHEN 'ARCHIVED' THEN 'ARCHIVED'::public.campaign_publish_status
  ELSE 'DRAFT'::public.campaign_publish_status
END
FROM public.campaigns c
WHERE c.id = cs.campaign_id;

-- 4. Public read access to settings of public campaigns
GRANT SELECT ON public.campaign_settings TO anon;

CREATE POLICY "Public read campaign settings" ON public.campaign_settings
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_settings.campaign_id
        AND c.visibility = 'PUBLIC'
        AND c.deleted_at IS NULL
        AND c.status = ANY (ARRAY['SCHEDULED'::campaign_status,'ACTIVE'::campaign_status,'PAUSED'::campaign_status,'FINISHED'::campaign_status])
    )
  );

-- 5. Unique slug for live campaigns
CREATE UNIQUE INDEX IF NOT EXISTS campaigns_slug_unique_active
  ON public.campaigns (slug) WHERE deleted_at IS NULL;
