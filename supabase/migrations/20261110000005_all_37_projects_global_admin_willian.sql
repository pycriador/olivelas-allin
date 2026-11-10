-- =============================================================================
-- MIGRATION: 20261110000005_all_37_projects_global_admin_willian.sql
-- OBJETIVO:
-- 1. Provisionar os schemas dedicados para os novos projetos com banco de dados:
--    album_figurinhas, artes_caneca, casa_organizada_ai, cesta_cafe_manha,
--    collection_vault, dashboard_bi, olivelas_iam_forms, forms_pro, iam_suite,
--    inventario_jogos, link_promo.
-- 2. Garantir que willian.o.jesus@gmail.com (00000000-0000-0000-0000-000000000001)
--    esteja cadastrado como Administrador Global em todas as tabelas de perfis,
--    usuários e roles de todas as plataformas no Supabase real, removendo
--    quaisquer usuários fictícios/demo.
-- =============================================================================

BEGIN;

DO $$
DECLARE
  v_willian_uuid UUID := '00000000-0000-0000-0000-000000000001';
  v_email TEXT := 'willian.o.jesus@gmail.com';
  v_name TEXT := 'Willian Jesus';
  v_schema TEXT;
  v_new_schemas TEXT[] := ARRAY[
    'album_figurinhas',
    'artes_caneca',
    'casa_organizada_ai',
    'cesta_cafe_manha',
    'collection_vault',
    'dashboard_bi',
    'olivelas_iam_forms',
    'forms_pro',
    'iam_suite',
    'inventario_jogos',
    'link_promo'
  ];
BEGIN
  -- 1. Criar schemas dedicados e tabelas base de perfis/roles para todos os novos projetos Supabase
  FOREACH v_schema IN ARRAY v_new_schemas LOOP
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_schema);
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO anon, authenticated, service_role', v_schema);

    EXECUTE format($sql$
      CREATE TABLE IF NOT EXISTS %I.profiles (
        id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
        email TEXT NOT NULL DEFAULT 'willian.o.jesus@gmail.com',
        full_name TEXT NOT NULL DEFAULT 'Willian Jesus',
        name TEXT NOT NULL DEFAULT 'Willian Jesus',
        role TEXT NOT NULL DEFAULT 'GLOBAL_ADMIN',
        status TEXT NOT NULL DEFAULT 'aprovado',
        is_global_admin BOOLEAN NOT NULL DEFAULT true,
        is_active BOOLEAN NOT NULL DEFAULT true,
        first_login_completed BOOLEAN NOT NULL DEFAULT false,
        avatar_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    $sql$, v_schema);

    EXECUTE format($sql$
      CREATE TABLE IF NOT EXISTS %I.user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (user_id, role)
      )
    $sql$, v_schema);

    -- Limpar usuários que não sejam willian.o.jesus@gmail.com e garantir o Global Admin
    EXECUTE format('DELETE FROM %I.profiles WHERE lower(email) <> lower(%L) AND id <> %L', v_schema, v_email, v_willian_uuid);
    EXECUTE format($sql$
      INSERT INTO %I.profiles (id, email, full_name, name, role, status, is_global_admin, is_active, first_login_completed)
      VALUES (%L, %L, %L, %L, 'GLOBAL_ADMIN', 'aprovado', true, true, false)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        name = EXCLUDED.name,
        role = 'GLOBAL_ADMIN',
        status = 'aprovado',
        is_global_admin = true,
        is_active = true,
        updated_at = now()
    $sql$, v_schema, v_willian_uuid, v_email, v_name, v_name);

    EXECUTE format('DELETE FROM %I.user_roles WHERE user_id <> %L', v_schema, v_willian_uuid);
    EXECUTE format($sql$
      INSERT INTO %I.user_roles (user_id, role)
      VALUES (%L, 'admin'), (%L, 'global_admin')
      ON CONFLICT (user_id, role) DO NOTHING
    $sql$, v_schema, v_willian_uuid, v_willian_uuid);

    EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO anon, authenticated, service_role', v_schema);
  END LOOP;

  -- 2. Garantir tabela específica de IAM Forms (olivelas_iam_forms.users)
  CREATE TABLE IF NOT EXISTS olivelas_iam_forms.users (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
    auth_id UUID,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    status TEXT NOT NULL DEFAULT 'active',
    department TEXT DEFAULT 'Diretoria Executiva & Engenharia',
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  DELETE FROM olivelas_iam_forms.users WHERE lower(email) <> lower(v_email);
  INSERT INTO olivelas_iam_forms.users (id, auth_id, email, full_name, role, status, department, password_hash)
  VALUES (v_willian_uuid, v_willian_uuid, v_email, 'Willian Jesus (Global Admin)', 'admin', 'active', 'Diretoria Executiva & Engenharia', NULL)
  ON CONFLICT (email) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    full_name = EXCLUDED.full_name,
    role = 'admin',
    status = 'active',
    updated_at = now();

  -- 3. Registrar todos os novos módulos no catálogo public.olivelas_ecosystem_modules (se existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'olivelas_ecosystem_modules'
  ) THEN
    INSERT INTO public.olivelas_ecosystem_modules (module_slug, folder_name, db_schema, display_name, category, auth_source)
    VALUES
      ('allin_album_figurinhas', 'album_figurinhas', 'album_figurinhas', 'Olivelas - Álbum de Figurinhas Digital', 'Criatividade & Engajamento', 'public.profiles'),
      ('allin_artes_caneca', 'artes_caneca', 'artes_caneca', 'Olivelas - Estúdio de Artes & Canecas', 'Criatividade & Design', 'public.profiles'),
      ('allin_casa_organizada_ai', 'casa_organizada_ai', 'casa_organizada_ai', 'Olivelas - Casa Organizada AI & Automação', 'Produtividade & IA', 'public.profiles'),
      ('allin_cesta_cafe_manha', 'cesta_cafe_manha', 'cesta_cafe_manha', 'Olivelas - Cestas de Café & Presentes', 'Comércio & Assinaturas', 'public.profiles'),
      ('allin_collection_vault', 'collection_vault', 'collection_vault', 'Olivelas - Collection Vault & Acervos', 'Catálogo & Colecionáveis', 'public.profiles'),
      ('allin_dashboard_bi', 'dashboard_bi', 'dashboard_bi', 'Olivelas - Dashboard BI & Analytics', 'Business Intelligence', 'public.profiles'),
      ('allin_forms', 'forms', 'olivelas_iam_forms', 'Olivelas - IAM Forms & Pesquisas', 'Formulários & Governança', 'public.profiles'),
      ('allin_forms_pro', 'forms_pro', 'forms_pro', 'Olivelas - Forms Pro Enterprise', 'Formulários & Automação', 'public.profiles'),
      ('allin_iam_suite', 'iam_suite', 'iam_suite', 'Olivelas - IAM Suite & Governança', 'Identidade & Acesso', 'public.profiles'),
      ('allin_inventario_jogos', 'inventario_jogos', 'inventario_jogos', 'Olivelas - Inventário de Jogos & Mídias', 'Inventário & Catálogo', 'public.profiles'),
      ('allin_link_promo', 'link_promo', 'link_promo', 'Olivelas - Link Promo & Afiliados', 'Marketing & Conversão', 'public.profiles')
    ON CONFLICT (module_slug) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      db_schema = EXCLUDED.db_schema;
  END IF;
END $$;

COMMIT;
