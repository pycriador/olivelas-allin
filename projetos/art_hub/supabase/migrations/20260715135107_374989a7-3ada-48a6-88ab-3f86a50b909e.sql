
CREATE POLICY "Admins manage olivelas media"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id IN ('collection-images', 'artwork-images', 'branding')
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id IN ('collection-images', 'artwork-images', 'branding')
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Authenticated can read olivelas media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('collection-images', 'artwork-images', 'branding'));
