CREATE POLICY "assets_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-assets' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id::text = auth.uid()::text AND p.status = 'active'));

CREATE POLICY "assets_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-assets' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id::text = auth.uid()::text AND p.status = 'active'));

CREATE POLICY "assets_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'project-assets' AND owner = auth.uid());

CREATE POLICY "assets_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'project-assets' AND owner = auth.uid());