-- =============================================================================
-- OLIVELAS ALL IN - MIGRATION 04: SINGLE GLOBAL ADMIN (WILLIAN JESUS) & FIRST LOGIN PASSWORD SETUP
-- =============================================================================
-- 1. Remove todos os usuários de demonstração/antigos de public.profiles, auth.users,
--    public.company_users, public.allin_entity_store e tabelas auxiliares dos 16 módulos.
-- 2. Cadastra exclusivamente willian.o.jesus@gmail.com (Willian Jesus) como Global Admin
--    em todas as ferramentas, empresas e schemas.
-- 3. Configura o fluxo de definição de senha no primeiro login (password_hash = NULL,
--    require_password_reset = TRUE) refletindo imediatamente em public.profiles e auth.users.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. GARANTE QUE O PERFIL GLOBAL ADMIN (usr-super-admin) EXISTA ANTES DO REDIRECIONAMENTO DE FKs
-- -----------------------------------------------------------------------------
DELETE FROM public.profiles
WHERE lower(email) = 'willian.o.jesus@gmail.com'
  AND id <> 'usr-super-admin';

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  phone,
  is_global_admin,
  status,
  language,
  role_ids,
  company_ids,
  individual_permissions,
  granular_permissions,
  password_hash,
  pin_hash,
  require_password_reset,
  job_title,
  department
)
VALUES (
  'usr-super-admin',
  'willian.o.jesus@gmail.com',
  'Willian Jesus',
  '+55 11 99800-1001',
  TRUE,
  'active',
  'pt-BR',
  '["role-super-admin"]'::jsonb,
  '["emp-olivelas-matriz", "emp-aurora-log", "emp-vega-retail", "emp-solaris-tech", "comp_nebula", "comp_aurora"]'::jsonb,
  '[]'::jsonb,
  '["*"]'::jsonb,
  NULL,
  NULL,
  TRUE,
  'Global Admin & Founder',
  'Diretoria Global Olivelas'
)
ON CONFLICT (id) DO UPDATE
SET password_hash = CASE
      WHEN public.profiles.password_hash IS NOT NULL
           AND public.profiles.password_hash = crypt('Olivelas@2026', public.profiles.password_hash) THEN NULL
      WHEN lower(public.profiles.email) = 'willian.o.jesus@gmail.com' THEN public.profiles.password_hash
      ELSE NULL
    END,
    require_password_reset = CASE
      WHEN public.profiles.password_hash IS NOT NULL
           AND public.profiles.password_hash = crypt('Olivelas@2026', public.profiles.password_hash) THEN TRUE
      WHEN lower(public.profiles.email) = 'willian.o.jesus@gmail.com' THEN public.profiles.require_password_reset
      ELSE TRUE
    END,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    is_global_admin = TRUE,
    status = 'active',
    role_ids = EXCLUDED.role_ids,
    company_ids = EXCLUDED.company_ids,
    individual_permissions = '[]'::jsonb,
    granular_permissions = EXCLUDED.granular_permissions,
    job_title = EXCLUDED.job_title,
    department = EXCLUDED.department,
    failed_login_attempts = 0,
    locked_until = NULL,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- 2. ATUALIZA REFERÊNCIAS NOS 16 MÓDULOS E REMOVE TODOS OS OUTROS USUÁRIOS
-- -----------------------------------------------------------------------------
UPDATE app_condominio.condominiums SET syndic_user_id = 'usr-super-admin';
UPDATE app_condominio.units SET resident_user_id = 'usr-super-admin', resident_name = 'Willian Jesus';
UPDATE app_condominio.reservations SET resident_user_id = 'usr-super-admin';
UPDATE app_condominio.announcements SET author_user_id = 'usr-super-admin';
UPDATE app_condominio.occurrences SET reporter_user_id = 'usr-super-admin';
UPDATE casa_organizada.household_profiles SET owner_user_id = 'usr-super-admin';
UPDATE casa_organizada.custom_tasks SET assigned_user_id = 'usr-super-admin';
UPDATE casa_organizada.task_completions SET completed_by_user_id = 'usr-super-admin';
UPDATE gestao_estoque.orders SET user_id = 'usr-super-admin';
UPDATE public.allin_audit_events SET actor_user_id = 'usr-super-admin', actor_name = 'Willian Jesus', actor_email = 'willian.o.jesus@gmail.com';
UPDATE public.allin_rag_documents SET created_by = 'willian.o.jesus@gmail.com';

-- Remove vínculos de outros usuários e mantém somente usr-super-admin
DELETE FROM gestao_estoque.store_users WHERE user_id <> 'usr-super-admin';
DELETE FROM public.company_users WHERE user_id <> 'usr-super-admin';
DELETE FROM public.allin_entity_store WHERE store_name = 'users' AND id <> 'usr-super-admin';
DELETE FROM public.profiles WHERE id <> 'usr-super-admin';

-- Atualiza quadros de profissionais/equipe dos módulos para refletir apenas o Global Admin Willian Jesus
DELETE FROM agendamentos.professionals WHERE id <> 'prof_1';
UPDATE agendamentos.professionals
SET user_id = 'usr-super-admin',
    name = 'Willian Jesus (Global Admin)',
    email = 'willian.o.jesus@gmail.com',
    specialty = 'Direção Geral & Gestão Clínica'
WHERE id = 'prof_1';

DELETE FROM ordem_de_servico.technicians WHERE id <> 'tech_os_1';
UPDATE ordem_de_servico.technicians
SET user_id = 'usr-super-admin',
    name = 'Willian Jesus (Global Admin)',
    specialty = 'Global Admin & Engenheiro Responsável'
WHERE id = 'tech_os_1';

DELETE FROM personal_treiner.trainers WHERE id <> 'trn_1';
UPDATE personal_treiner.trainers
SET user_id = 'usr-super-admin',
    full_name = 'Willian Jesus (Global Admin)',
    email = 'willian.o.jesus@gmail.com',
    cref = 'CREF 014820-G/SP (Global Admin)',
    specialty = 'Diretor Técnico & Global Admin'
WHERE id = 'trn_1';

DELETE FROM sistema_delivery.couriers WHERE id <> 'cour_1';
UPDATE sistema_delivery.couriers
SET user_id = 'usr-super-admin',
    name = 'Willian Jesus (Global Admin)'
WHERE id = 'cour_1';

-- Vincula Willian Jesus como GLOBAL_ADMIN em todas as empresas registradas
INSERT INTO public.company_users (company_id, user_id, role, is_active)
SELECT c.id, 'usr-super-admin', 'GLOBAL_ADMIN', TRUE
FROM public.allin_companies c
ON CONFLICT (company_id, user_id) DO UPDATE
SET role = 'GLOBAL_ADMIN',
    is_active = TRUE;

-- Vincula Willian Jesus como GLOBAL_ADMIN em todas as lojas/unidades do Gestão de Estoque
INSERT INTO gestao_estoque.store_users (store_id, user_id, role, is_active)
SELECT s.id, 'usr-super-admin', 'GLOBAL_ADMIN', TRUE
FROM gestao_estoque.stores s
ON CONFLICT (store_id, user_id) DO UPDATE
SET role = 'GLOBAL_ADMIN',
    is_active = TRUE;

-- Espelha o único usuário em public.allin_entity_store (store_name = 'users')
INSERT INTO public.allin_entity_store (store_name, id, company_id, payload, is_archived, updated_at)
VALUES (
  'users',
  'usr-super-admin',
  'emp-olivelas-matriz',
  jsonb_build_object(
    'id', 'usr-super-admin',
    'name', 'Willian Jesus',
    'email', 'willian.o.jesus@gmail.com',
    'phone', '+55 11 99800-1001',
    'status', 'active',
    'language', 'pt-BR',
    'jobTitle', 'Global Admin & Founder',
    'department', 'Diretoria Global Olivelas',
    'companyIds', jsonb_build_array('emp-olivelas-matriz', 'emp-aurora-log', 'emp-vega-retail', 'emp-solaris-tech'),
    'roleIds', jsonb_build_array('role-super-admin'),
    'individualPermissions', jsonb_build_array(),
    'granularPermissions', jsonb_build_array('*'),
    'archiveMetadata', jsonb_build_object('isArchived', false),
    'changeHistory', jsonb_build_array()
  ),
  FALSE,
  now()
)
ON CONFLICT (store_name, id) DO UPDATE
SET payload = EXCLUDED.payload,
    is_archived = FALSE,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- 3. SINCRONIZA auth.users E auth.identities DO SUPABASE REAL
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_auth_uid UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  v_current_hash TEXT;
BEGIN
  SELECT password_hash INTO v_current_hash
  FROM public.profiles
  WHERE id = 'usr-super-admin';

  -- Remove quaisquer outros usuários de auth.identities e auth.users
  DELETE FROM auth.identities WHERE lower(email) <> 'willian.o.jesus@gmail.com';
  DELETE FROM auth.users WHERE lower(email) <> 'willian.o.jesus@gmail.com';

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = 'willian.o.jesus@gmail.com') THEN
    SELECT id INTO v_auth_uid FROM auth.users WHERE lower(email) = 'willian.o.jesus@gmail.com' LIMIT 1;
    UPDATE auth.users
    SET encrypted_password = v_current_hash,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_app_meta_data = '{"provider": "email", "providers": ["email"], "role": "GLOBAL_ADMIN", "is_global_admin": true}'::jsonb,
        raw_user_meta_data = '{"full_name": "Willian Jesus", "name": "Willian Jesus", "is_global_admin": true, "role": "GLOBAL_ADMIN"}'::jsonb,
        is_super_admin = TRUE,
        updated_at = now()
    WHERE id = v_auth_uid;
  ELSE
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      v_auth_uid,
      'authenticated',
      'authenticated',
      'willian.o.jesus@gmail.com',
      v_current_hash,
      now(),
      '{"provider": "email", "providers": ["email"], "role": "GLOBAL_ADMIN", "is_global_admin": true}'::jsonb,
      '{"full_name": "Willian Jesus", "name": "Willian Jesus", "is_global_admin": true, "role": "GLOBAL_ADMIN"}'::jsonb,
      TRUE,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_auth_uid,
    v_auth_uid,
    'willian.o.jesus@gmail.com',
    jsonb_build_object(
      'sub', v_auth_uid::text,
      'email', 'willian.o.jesus@gmail.com',
      'email_verified', true,
      'full_name', 'Willian Jesus',
      'is_global_admin', true
    ),
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider_id, provider) DO UPDATE
  SET identity_data = EXCLUDED.identity_data,
      updated_at = now();

  UPDATE public.profiles
  SET auth_user_id = v_auth_uid
  WHERE id = 'usr-super-admin';
END $$;

-- -----------------------------------------------------------------------------
-- 4. RPC PARA VERIFICAR STATUS DE PRIMEIRO LOGIN E AUTENTICAÇÃO COM DEFINIÇÃO DE SENHA
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_olivelas_first_login(
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_clean_email TEXT := lower(trim(COALESCE(p_email, '')));
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE lower(email) = v_clean_email
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'exists', FALSE,
      'needs_password_setup', FALSE
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'exists', TRUE,
    'id', v_profile.id,
    'email', v_profile.email,
    'full_name', v_profile.full_name,
    'is_global_admin', v_profile.is_global_admin,
    'needs_password_setup', (v_profile.password_hash IS NULL OR v_profile.require_password_reset = TRUE)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.authenticate_olivelas_user(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_clean_email TEXT := lower(trim(COALESCE(p_email, '')));
  v_new_hash TEXT;
  v_first_login BOOLEAN := FALSE;
BEGIN
  IF v_clean_email = '' OR COALESCE(p_password, '') = '' THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'code', 'MISSING_CREDENTIALS',
      'message', 'Informe o e-mail e a senha para autenticar.'
    );
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE lower(email) = v_clean_email
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'code', 'INVALID_CREDENTIALS',
      'message', 'Acesso restrito: usuário não cadastrado em public.profiles.'
    );
  END IF;

  IF v_profile.status IN ('blocked', 'archived') THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'code', 'ACCOUNT_BLOCKED',
      'message', 'Esta conta encontra-se bloqueada ou arquivada pela governança HBAC.'
    );
  END IF;

  IF v_profile.locked_until IS NOT NULL AND v_profile.locked_until > now() THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'code', 'ACCOUNT_LOCKED',
      'message', 'Conta temporariamente bloqueada por tentativas inválidas. Tente novamente em alguns minutos.'
    );
  END IF;

  -- Fluxo de Primeiro Login: se password_hash for NULL ou require_password_reset = TRUE,
  -- grava a senha informada como a senha oficial criptografada (bcrypt) em public.profiles e auth.users
  IF v_profile.password_hash IS NULL OR v_profile.require_password_reset = TRUE THEN
    IF length(trim(p_password)) < 6 THEN
      RETURN jsonb_build_object(
        'ok', FALSE,
        'code', 'WEAK_FIRST_PASSWORD',
        'needs_password_setup', TRUE,
        'message', 'Primeiro acesso detectado: escolha uma senha com no mínimo 6 caracteres para gravar no Supabase.'
      );
    END IF;

    v_new_hash := crypt(p_password, gen_salt('bf'));
    v_first_login := TRUE;

    UPDATE public.profiles
    SET password_hash = v_new_hash,
        require_password_reset = FALSE,
        failed_login_attempts = 0,
        locked_until = NULL,
        last_login_at = now(),
        updated_at = now()
    WHERE id = v_profile.id;

    UPDATE auth.users
    SET encrypted_password = v_new_hash,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE lower(email) = v_clean_email;

    INSERT INTO public.allin_audit_events (
      id, company_id, actor_user_id, actor_name, actor_email, action, module, target_type, target_id, target_label, reason, severity
    ) VALUES (
      'aud_first_pw_' || extract(epoch from now())::bigint::text || '_' || substr(md5(random()::text), 1, 4),
      'emp-olivelas-matriz',
      v_profile.id,
      v_profile.full_name,
      v_profile.email,
      'first_login_password_setup',
      'allin_core',
      'UserCredentials',
      v_profile.id,
      v_profile.email,
      'Senha definida no primeiro login e sincronizada com bcrypt em public.profiles e auth.users',
      'info'
    );
  ELSE
    -- Verifica o hash bcrypt da senha já configurada
    IF v_profile.password_hash <> crypt(p_password, v_profile.password_hash) THEN
      UPDATE public.profiles
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE WHEN failed_login_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END,
          updated_at = now()
      WHERE id = v_profile.id;

      RETURN jsonb_build_object(
        'ok', FALSE,
        'code', 'INVALID_CREDENTIALS',
        'message', 'Senha incorreta para ' || v_profile.email || '.'
      );
    END IF;

    UPDATE public.profiles
    SET failed_login_attempts = 0,
        locked_until = NULL,
        last_login_at = now(),
        updated_at = now()
    WHERE id = v_profile.id;

    INSERT INTO public.allin_audit_events (
      id, company_id, actor_user_id, actor_name, actor_email, action, module, target_type, target_id, target_label, reason, severity
    ) VALUES (
      'aud_login_' || extract(epoch from now())::bigint::text || '_' || substr(md5(random()::text), 1, 4),
      'emp-olivelas-matriz',
      v_profile.id,
      v_profile.full_name,
      v_profile.email,
      'login',
      'allin_core',
      'UserSession',
      v_profile.id,
      v_profile.email,
      'Autenticação real via Supabase (public.profiles + auth.users)',
      'info'
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'first_login_configured', v_first_login,
    'message', CASE
      WHEN v_first_login THEN 'Senha de Global Admin configurada no primeiro login e gravada no Supabase!'
      ELSE 'Autenticado com sucesso no Supabase.'
    END,
    'user', jsonb_build_object(
      'id', v_profile.id,
      'email', v_profile.email,
      'full_name', v_profile.full_name,
      'phone', v_profile.phone,
      'is_global_admin', v_profile.is_global_admin,
      'status', v_profile.status,
      'language', v_profile.language,
      'role_ids', v_profile.role_ids,
      'company_ids', v_profile.company_ids,
      'individual_permissions', v_profile.individual_permissions,
      'granular_permissions', v_profile.granular_permissions,
      'job_title', v_profile.job_title,
      'department', v_profile.department,
      'last_login_at', now()
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.change_olivelas_password(
  p_user_id TEXT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_hash TEXT;
  v_email TEXT;
BEGIN
  IF length(trim(COALESCE(p_new_password, ''))) < 6 THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'message', 'A nova senha deve possuir no mínimo 6 caracteres.'
    );
  END IF;

  v_new_hash := crypt(p_new_password, gen_salt('bf'));

  UPDATE public.profiles
  SET password_hash = v_new_hash,
      require_password_reset = FALSE,
      failed_login_attempts = 0,
      locked_until = NULL,
      updated_at = now()
  WHERE id = p_user_id OR lower(email) = lower(trim(p_user_id))
  RETURNING email INTO v_email;

  IF v_email IS NULL THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'message', 'Usuário não localizado em public.profiles.'
    );
  END IF;

  UPDATE auth.users
  SET encrypted_password = v_new_hash,
      updated_at = now()
  WHERE lower(email) = lower(v_email);

  RETURN jsonb_build_object(
    'ok', TRUE,
    'message', 'Senha atualizada com criptografia bcrypt em public.profiles e auth.users.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_olivelas_first_login(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.authenticate_olivelas_user(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.change_olivelas_password(TEXT, TEXT) TO anon, authenticated, service_role;
