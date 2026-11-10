
-- SELECT: qualquer autenticado
CREATE POLICY "storage_app_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id IN ('collection-covers','arts','mockups','avatars'));

-- Avatars: usuário gerencia o seu próprio (pasta = user id)
CREATE POLICY "storage_avatars_own_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "storage_avatars_own_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "storage_avatars_own_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Coleções, artes, mockups: editor/admin pode escrever; admin pode deletar
CREATE POLICY "storage_app_insert_editor" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('collection-covers','arts','mockups')
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
);
CREATE POLICY "storage_app_update_editor" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('collection-covers','arts','mockups')
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
);
CREATE POLICY "storage_app_delete_admin" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('collection-covers','arts','mockups')
  AND public.has_role(auth.uid(),'admin')
);
