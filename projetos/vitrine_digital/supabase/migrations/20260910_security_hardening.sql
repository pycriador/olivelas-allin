-- ==============================================================================
-- MIGRAÇÃO DE ENDURECIMENTO DE SEGURANÇA E RLS (ROW LEVEL SECURITY) - V2
-- Execute este script no SQL Editor do seu Supabase Dashboard
-- ==============================================================================

-- 1. Funções de Verificação de Autorização e Perfil (SECURITY INVOKER para conformidade com linter 0029)
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.iam_users 
    WHERE (id = auth.uid() OR email = (auth.jwt() ->> 'email'))
      AND role = 'global_admin'
      AND is_active = true
  ) OR ((auth.jwt() ->> 'email') = 'willian.o.jesus@gmail.com');
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_analyst()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.iam_users 
    WHERE (id = auth.uid() OR email = (auth.jwt() ->> 'email'))
      AND role IN ('global_admin', 'analyst')
      AND is_active = true
  ) OR ((auth.jwt() ->> 'email') = 'willian.o.jesus@gmail.com');
$$;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.iam_users WHERE id = auth.uid() OR email = (auth.jwt() ->> 'email') LIMIT 1),
    'consumer'
  );
$$;

-- Restringe privilégios de execução apenas para authenticated e service_role
REVOKE EXECUTE ON FUNCTION public.is_global_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_global_admin() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_admin_or_analyst() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_analyst() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_auth_role() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated, service_role;


-- 2. Habilitação de RLS em Todas as Tabelas
ALTER TABLE public.iam_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iam_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iam_api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iam_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_analysis ENABLE ROW LEVEL SECURITY;


-- 3. Limpeza Geral de Políticas Inseguras Anteriores (incluindo as permissivas do storage)
DROP POLICY IF EXISTS "Acesso público leitura iam_groups" ON public.iam_groups;
DROP POLICY IF EXISTS "Acesso público escrita iam_groups" ON public.iam_groups;
DROP POLICY IF EXISTS "Acesso público leitura iam_users" ON public.iam_users;
DROP POLICY IF EXISTS "Acesso público escrita iam_users" ON public.iam_users;
DROP POLICY IF EXISTS "Acesso público leitura iam_api_tokens" ON public.iam_api_tokens;
DROP POLICY IF EXISTS "Acesso público escrita iam_api_tokens" ON public.iam_api_tokens;
DROP POLICY IF EXISTS "Acesso público leitura art_submissions" ON public.art_submissions;
DROP POLICY IF EXISTS "Acesso público escrita art_submissions" ON public.art_submissions;
DROP POLICY IF EXISTS "Acesso público leitura iam_prompts" ON public.iam_prompts;
DROP POLICY IF EXISTS "Acesso público escrita iam_prompts" ON public.iam_prompts;
DROP POLICY IF EXISTS "Acesso público leitura ai_usage_logs" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Acesso público escrita ai_usage_logs" ON public.ai_usage_logs;

-- Limpeza de image_analysis
DROP POLICY IF EXISTS "Permitir leitura pública" ON public.image_analysis;
DROP POLICY IF EXISTS "Permitir inserção pública" ON public.image_analysis;
DROP POLICY IF EXISTS "Permitir atualização pública" ON public.image_analysis;
DROP POLICY IF EXISTS "Permitir exclusão pública" ON public.image_analysis;
DROP POLICY IF EXISTS "public insert" ON public.image_analysis;
DROP POLICY IF EXISTS "public update" ON public.image_analysis;
DROP POLICY IF EXISTS "public delete" ON public.image_analysis;
DROP POLICY IF EXISTS "image_analysis_public_select_policy" ON public.image_analysis;
DROP POLICY IF EXISTS "image_analysis_staff_all_policy" ON public.image_analysis;
DROP POLICY IF EXISTS "image_analysis_insert_policy" ON public.image_analysis;
DROP POLICY IF EXISTS "image_analysis_staff_update_policy" ON public.image_analysis;
DROP POLICY IF EXISTS "image_analysis_staff_delete_policy" ON public.image_analysis;

-- Limpeza de storage.objects
DROP POLICY IF EXISTS "images delete" ON storage.objects;
DROP POLICY IF EXISTS "images insert" ON storage.objects;
DROP POLICY IF EXISTS "images read" ON storage.objects;
DROP POLICY IF EXISTS "images select" ON storage.objects;
DROP POLICY IF EXISTS "images update" ON storage.objects;
DROP POLICY IF EXISTS "images_storage_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "images_storage_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "images_storage_modify_policy" ON storage.objects;


-- ==============================================================================
-- 4. POLÍTICAS SEGURAS: iam_groups
-- ==============================================================================
CREATE POLICY "iam_groups_select_policy" ON public.iam_groups
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "iam_groups_admin_all_policy" ON public.iam_groups
FOR ALL TO authenticated
USING (public.is_global_admin())
WITH CHECK (public.is_global_admin());


-- ==============================================================================
-- 5. POLÍTICAS SEGURAS: iam_users
-- ==============================================================================
CREATE POLICY "iam_users_select_policy" ON public.iam_users
FOR SELECT TO authenticated
USING (
  (auth.uid() = id) 
  OR (email = (auth.jwt() ->> 'email'))
  OR public.is_admin_or_analyst()
);

CREATE POLICY "iam_users_insert_policy" ON public.iam_users
FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = id AND role = 'consumer')
  OR public.is_global_admin()
);

CREATE POLICY "iam_users_update_policy" ON public.iam_users
FOR UPDATE TO authenticated
USING (
  (auth.uid() = id) OR public.is_global_admin()
)
WITH CHECK (
  public.is_global_admin()
  OR (
    auth.uid() = id 
    AND role = (SELECT role FROM public.iam_users WHERE id = auth.uid())
  )
);

CREATE POLICY "iam_users_delete_policy" ON public.iam_users
FOR DELETE TO authenticated
USING (public.is_global_admin());


-- ==============================================================================
-- 6. POLÍTICAS SEGURAS: iam_api_tokens
-- ==============================================================================
CREATE POLICY "iam_api_tokens_select_policy" ON public.iam_api_tokens
FOR SELECT TO authenticated
USING (
  (auth.uid() = user_id) OR public.is_global_admin()
);

CREATE POLICY "iam_api_tokens_all_policy" ON public.iam_api_tokens
FOR ALL TO authenticated
USING (
  (auth.uid() = user_id) OR public.is_global_admin()
)
WITH CHECK (
  (auth.uid() = user_id) OR public.is_global_admin()
);


-- ==============================================================================
-- 7. POLÍTICAS SEGURAS: art_submissions
-- ==============================================================================
CREATE POLICY "art_submissions_select_policy" ON public.art_submissions
FOR SELECT TO authenticated
USING (
  (auth.uid()::text = submitted_by_user_id)
  OR (submitted_by_email = (auth.jwt() ->> 'email'))
  OR public.is_admin_or_analyst()
);

CREATE POLICY "art_submissions_insert_policy" ON public.art_submissions
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid()::text = submitted_by_user_id
);

CREATE POLICY "art_submissions_update_policy" ON public.art_submissions
FOR UPDATE TO authenticated
USING (
  public.is_admin_or_analyst()
  OR (auth.uid()::text = submitted_by_user_id AND status = 'pending')
)
WITH CHECK (
  public.is_admin_or_analyst()
  OR (auth.uid()::text = submitted_by_user_id AND status = 'pending')
);

CREATE POLICY "art_submissions_delete_policy" ON public.art_submissions
FOR DELETE TO authenticated
USING (
  public.is_global_admin()
  OR (auth.uid()::text = submitted_by_user_id AND status = 'pending')
);


-- ==============================================================================
-- 8. POLÍTICAS SEGURAS: iam_prompts
-- ==============================================================================
CREATE POLICY "iam_prompts_select_policy" ON public.iam_prompts
FOR SELECT
USING (
  is_active = true OR public.is_admin_or_analyst()
);

CREATE POLICY "iam_prompts_admin_all_policy" ON public.iam_prompts
FOR ALL TO authenticated
USING (public.is_global_admin())
WITH CHECK (public.is_global_admin());


-- ==============================================================================
-- 9. POLÍTICAS SEGURAS: ai_usage_logs
-- ==============================================================================
CREATE POLICY "ai_usage_logs_select_policy" ON public.ai_usage_logs
FOR SELECT TO authenticated
USING (
  public.is_admin_or_analyst()
  OR (user_id = auth.uid()::text)
  OR (user_email = (auth.jwt() ->> 'email'))
);

CREATE POLICY "ai_usage_logs_insert_policy" ON public.ai_usage_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ai_usage_logs_admin_modify_policy" ON public.ai_usage_logs
FOR ALL TO authenticated
USING (public.is_global_admin())
WITH CHECK (public.is_global_admin());


-- ==============================================================================
-- 10. POLÍTICAS SEGURAS: image_analysis
-- ==============================================================================
-- Leitura pública para itens marcados como visíveis na vitrine ou concluídos
CREATE POLICY "image_analysis_public_select_policy" ON public.image_analysis
FOR SELECT
USING (
  COALESCE((analysis ->> 'is_visible_in_store')::boolean, (analysis ->> 'isVisibleInStore')::boolean, true) = true
  OR status = 'completed'
  OR public.is_admin_or_analyst()
);

-- Inserção permitida para staff ou consumidores autenticados
CREATE POLICY "image_analysis_insert_policy" ON public.image_analysis
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Modificações e Exclusões restritas exclusivamente a Administradores e Analistas
CREATE POLICY "image_analysis_staff_update_policy" ON public.image_analysis
FOR UPDATE TO authenticated
USING (public.is_admin_or_analyst())
WITH CHECK (public.is_admin_or_analyst());

CREATE POLICY "image_analysis_staff_delete_policy" ON public.image_analysis
FOR DELETE TO authenticated
USING (public.is_admin_or_analyst());


-- ==============================================================================
-- 11. POLÍTICAS SEGURAS DO STORAGE (BUCKET: images)
-- ==============================================================================
-- Leitura: restrita a usuários autenticados ou imagens públicas via signed URLs
CREATE POLICY "images_storage_select_policy" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'images');

-- Upload: permitido exclusivamente a usuários autenticados
CREATE POLICY "images_storage_insert_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');

-- Modificação e exclusão: restrita a analistas/admins ou proprietário do arquivo
CREATE POLICY "images_storage_modify_policy" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'images' 
  AND (
    public.is_admin_or_analyst()
    OR (auth.uid()::text = (storage.foldername(name))[1])
    OR (auth.uid()::text = (storage.foldername(name))[2])
  )
)
WITH CHECK (
  bucket_id = 'images'
  AND (
    public.is_admin_or_analyst()
    OR (auth.uid()::text = (storage.foldername(name))[1])
    OR (auth.uid()::text = (storage.foldername(name))[2])
  )
);
