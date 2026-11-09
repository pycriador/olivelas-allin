
CREATE OR REPLACE FUNCTION public.storage_org_id(_name TEXT)
RETURNS UUID LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE _parts TEXT[]; _id UUID;
BEGIN
  _parts := string_to_array(_name, '/');
  IF array_length(_parts,1) < 2 OR _parts[1] <> 'organizations' THEN RETURN NULL; END IF;
  BEGIN _id := _parts[2]::uuid; EXCEPTION WHEN others THEN RETURN NULL; END;
  RETURN _id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.storage_org_id(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.storage_org_id(TEXT) TO authenticated;

CREATE POLICY "org_assets_select_members" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'org-assets'
  AND public.storage_org_id(name) IS NOT NULL
  AND (public.is_org_member(public.storage_org_id(name)) OR public.is_global_admin())
);

CREATE POLICY "org_assets_insert_admins" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'org-assets'
  AND public.storage_org_id(name) IS NOT NULL
  AND (
    public.is_global_admin()
    OR (public.has_org_role(public.storage_org_id(name), ARRAY['OWNER','ADMIN']::public.org_role[])
        AND public.org_is_active(public.storage_org_id(name)))
  )
);

CREATE POLICY "org_assets_update_admins" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'org-assets' AND public.storage_org_id(name) IS NOT NULL
  AND (public.is_global_admin() OR (public.has_org_role(public.storage_org_id(name), ARRAY['OWNER','ADMIN']::public.org_role[]) AND public.org_is_active(public.storage_org_id(name))))
)
WITH CHECK (
  bucket_id = 'org-assets' AND public.storage_org_id(name) IS NOT NULL
  AND (public.is_global_admin() OR (public.has_org_role(public.storage_org_id(name), ARRAY['OWNER','ADMIN']::public.org_role[]) AND public.org_is_active(public.storage_org_id(name))))
);

CREATE POLICY "org_assets_delete_admins" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'org-assets' AND public.storage_org_id(name) IS NOT NULL
  AND (public.is_global_admin() OR (public.has_org_role(public.storage_org_id(name), ARRAY['OWNER','ADMIN']::public.org_role[]) AND public.org_is_active(public.storage_org_id(name))))
);
