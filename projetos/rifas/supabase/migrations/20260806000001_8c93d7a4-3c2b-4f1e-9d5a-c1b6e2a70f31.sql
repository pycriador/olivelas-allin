-- CAMPAIGNS: Sprint 3 — módulo de gerenciamento de campanhas

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.campaign_status AS ENUM (
  'DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'FINISHED', 'CANCELLED', 'ARCHIVED'
);
CREATE TYPE public.campaign_visibility AS ENUM ('PUBLIC', 'PRIVATE');

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  product_name TEXT NOT NULL,
  product_description TEXT,
  number_start BIGINT NOT NULL,
  number_end BIGINT NOT NULL,
  total_numbers BIGINT GENERATED ALWAYS AS (number_end - number_start + 1) STORED,
  price_per_number NUMERIC(12, 2) NOT NULL,
  cover_image TEXT,
  status public.campaign_status NOT NULL DEFAULT 'DRAFT',
  visibility public.campaign_visibility NOT NULL DEFAULT 'PUBLIC',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  allow_random_selection BOOLEAN NOT NULL DEFAULT true,
  reservation_timeout_minutes INTEGER NOT NULL DEFAULT 10,
  max_numbers_per_purchase INTEGER,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT campaigns_number_range_check CHECK (number_end >= number_start),
  CONSTRAINT campaigns_price_check CHECK (price_per_number >= 0),
  CONSTRAINT campaigns_reservation_timeout_check CHECK (reservation_timeout_minutes > 0),
  CONSTRAINT campaigns_max_numbers_check CHECK (
    max_numbers_per_purchase IS NULL OR max_numbers_per_purchase >= 1
  )
);

COMMENT ON COLUMN public.campaigns.total_numbers IS 'Derivado de number_start/number_end: grade totalmente flexível (ex.: 0-200, 1-1000, 10000-19999).';

CREATE INDEX campaigns_status_idx ON public.campaigns (status);
CREATE INDEX campaigns_visibility_idx ON public.campaigns (visibility);
CREATE INDEX campaigns_created_by_idx ON public.campaigns (created_by);
CREATE INDEX campaigns_created_at_idx ON public.campaigns (created_at DESC);
CREATE INDEX campaigns_deleted_at_idx ON public.campaigns (deleted_at);
CREATE INDEX campaigns_slug_idx ON public.campaigns (slug);

-- ---------------------------------------------------------------------------
-- campaign_images
-- ---------------------------------------------------------------------------
CREATE TABLE public.campaign_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_images_one_cover_per_campaign UNIQUE (campaign_id, is_cover)
);

CREATE INDEX campaign_images_campaign_idx ON public.campaign_images (campaign_id, display_order);

-- ---------------------------------------------------------------------------
-- campaign_settings (inclui campos de SEO e imagem de compartilhamento)
-- ---------------------------------------------------------------------------
CREATE TABLE public.campaign_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL UNIQUE REFERENCES public.campaigns(id) ON DELETE CASCADE,
  show_progress BOOLEAN NOT NULL DEFAULT true,
  show_remaining_numbers BOOLEAN NOT NULL DEFAULT true,
  show_product_value BOOLEAN NOT NULL DEFAULT true,
  enable_share BOOLEAN NOT NULL DEFAULT true,
  enable_seo BOOLEAN NOT NULL DEFAULT true,
  enable_public_page BOOLEAN NOT NULL DEFAULT true,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  share_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Triggers / funções
-- ---------------------------------------------------------------------------
-- Cria settings automaticamente quando uma campanha é criada.
CREATE OR REPLACE FUNCTION public.handle_new_campaign()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.campaign_settings (campaign_id) VALUES (NEW.id)
  ON CONFLICT (campaign_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_campaign_created
AFTER INSERT ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.handle_new_campaign();

CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER campaign_settings_updated_at BEFORE UPDATE ON public.campaign_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER campaign_images_updated_at BEFORE UPDATE ON public.campaign_images
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_settings TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
GRANT ALL ON public.campaign_images TO service_role;
GRANT ALL ON public.campaign_settings TO service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_settings ENABLE ROW LEVEL SECURITY;

-- Público: qualquer visitante pode ler campanhas públicas (defesa em profundidade;
-- a página pública também é servida via service role).
CREATE POLICY "Public read campaigns" ON public.campaigns FOR SELECT TO anon
USING (
  visibility = 'PUBLIC' AND deleted_at IS NULL
  AND status IN ('SCHEDULED', 'ACTIVE', 'PAUSED', 'FINISHED')
);

-- Apenas GLOBAL_ADMIN gerencia campanhas.
CREATE POLICY "Admins manage campaigns" ON public.campaigns FOR ALL TO authenticated
USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

CREATE POLICY "Admins manage campaign images" ON public.campaign_images FOR ALL TO authenticated
USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

CREATE POLICY "Admins manage campaign settings" ON public.campaign_settings FOR ALL TO authenticated
USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

-- ---------------------------------------------------------------------------
-- Storage: bucket público "campaign-media" + políticas de escrita/leitura admin
-- O bucket "files" permanece privado; imagens de campanha vão para um bucket
-- público dedicado para que a página pública /r/{slug} e o SEO consigam
-- exibi-las a visitantes não autenticados (public URL).
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-media', 'campaign-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins read campaign media objects" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'campaign-media' AND (storage.foldername(name))[1] = 'campaigns' AND public.is_global_admin());

CREATE POLICY "Admins insert campaign media objects" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'campaign-media' AND (storage.foldername(name))[1] = 'campaigns' AND public.is_global_admin());

CREATE POLICY "Admins update campaign media objects" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'campaign-media' AND (storage.foldername(name))[1] = 'campaigns' AND public.is_global_admin())
WITH CHECK (bucket_id = 'campaign-media' AND (storage.foldername(name))[1] = 'campaigns' AND public.is_global_admin());

CREATE POLICY "Admins delete campaign media objects" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'campaign-media' AND (storage.foldername(name))[1] = 'campaigns' AND public.is_global_admin());
