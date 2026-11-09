CREATE POLICY "Users read own storage objects" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'files' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_global_admin()));

CREATE POLICY "Users upload own storage objects" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own storage objects" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'files' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_global_admin()))
WITH CHECK (bucket_id = 'files' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_global_admin()));

CREATE POLICY "Users delete own storage objects" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'files' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_global_admin()));