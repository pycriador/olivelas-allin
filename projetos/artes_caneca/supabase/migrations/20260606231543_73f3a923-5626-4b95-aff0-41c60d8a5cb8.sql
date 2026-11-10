
-- Storage policies for project-files bucket
-- File path convention: {project_id}/{uuid}.{ext}

CREATE POLICY "project_files_read_members" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-files'
    AND public.can_access_project(auth.uid(), (string_to_array(name, '/'))[1]::uuid)
  );

CREATE POLICY "project_files_insert_team" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'client'))
  );

CREATE POLICY "project_files_delete_team" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-files'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  );
