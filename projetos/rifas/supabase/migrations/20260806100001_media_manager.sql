-- =============================================================================
-- Sprint 4.5 — Campaign Media Manager: evolve campaign_images
-- =============================================================================

-- 1. Enums
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_image_type') THEN
    CREATE TYPE public.campaign_image_type AS ENUM (
      'COVER',
      'GALLERY',
      'SHARE',
      'THUMBNAIL',
      'BANNER'
    );
  END IF;
END $$;

-- 2. Add columns to campaign_images
-- ---------------------------------------------------------------------------
ALTER TABLE public.campaign_images
  ADD COLUMN IF NOT EXISTS width INTEGER,
  ADD COLUMN IF NOT EXISTS height INTEGER,
  ADD COLUMN IF NOT EXISTS size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS image_type public.campaign_image_type NOT NULL DEFAULT 'GALLERY',
  ADD COLUMN IF NOT EXISTS alt_text TEXT,
  ADD COLUMN IF NOT EXISTS caption TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id);

-- 3. Backfill: existing cover images get image_type COVER
-- ---------------------------------------------------------------------------
UPDATE public.campaign_images
SET image_type = 'COVER'
WHERE is_cover = true AND image_type = 'GALLERY';

-- 4. Exclusive image types (only one COVER/SHARE/THUMBNAIL/BANNER per campaign)
--    Uses partial unique indexes to enforce at most one per campaign.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS campaign_images_one_cover_per_campaign
  ON public.campaign_images (campaign_id)
  WHERE image_type = 'COVER';

CREATE UNIQUE INDEX IF NOT EXISTS campaign_images_one_share_per_campaign
  ON public.campaign_images (campaign_id)
  WHERE image_type = 'SHARE';

CREATE UNIQUE INDEX IF NOT EXISTS campaign_images_one_thumbnail_per_campaign
  ON public.campaign_images (campaign_id)
  WHERE image_type = 'THUMBNAIL';

CREATE UNIQUE INDEX IF NOT EXISTS campaign_images_one_banner_per_campaign
  ON public.campaign_images (campaign_id)
  WHERE image_type = 'BANNER';

-- 5. Storage policies (already enforced via is_global_admin in existing migration)
--    Ensure public reads on campaign-media bucket remain unrestricted.
