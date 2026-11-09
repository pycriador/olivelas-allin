-- =============================================================================
-- Hotfix: garantir GLOBAL_ADMIN para willian.o.jesus@gmail.com
-- e corrigir trigger handle_new_user para ignorar perfis deletados
-- =============================================================================

-- 1. Conceder GLOBAL_ADMIN diretamente ao usuario especifico
-- ---------------------------------------------------------------------------
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'GLOBAL_ADMIN'::public.app_role
FROM public.profiles
WHERE email = 'willian.o.jesus@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Corrigir trigger: verificar apenas perfis ATIVOS (nao deletados)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
  assigned public.app_role;
BEGIN
  -- Ignora perfis deletados ao decidir se e o primeiro usuario
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE deleted_at IS NULL) INTO is_first;
  assigned := CASE WHEN is_first THEN 'GLOBAL_ADMIN'::public.app_role ELSE 'USER'::public.app_role END;

  INSERT INTO public.profiles (id, name, email, avatar_url, last_login)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;
