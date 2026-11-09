-- Make storage buckets public for the gallery
-- Ensures anonymous visitors can view all artwork and collection images

-- 1. Create buckets (idempotent) and make them public
INSERT INTO storage.buckets (id, name, public) VALUES
  ('collection-images', 'collection-images', true),
  ('artwork-images', 'artwork-images', true),
  ('branding', 'branding', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow anonymous SELECT on storage objects for public buckets
-- This is a safety net: public buckets already serve via getPublicUrl(),
-- but this policy ensures signed URL generation also works for anon.
DO $$ BEGIN
  CREATE POLICY "Public can read olivelas media"
    ON storage.objects FOR SELECT TO anon
    USING (bucket_id IN ('collection-images', 'artwork-images', 'branding'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Allow authenticated users to read (already exists but ensure consistency)
DO $$ BEGIN
  CREATE POLICY "Authenticated can read olivelas media v2"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id IN ('collection-images', 'artwork-images', 'branding'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
