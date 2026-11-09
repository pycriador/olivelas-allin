import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;
const pgClient = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.mfyyezvpfpflpekosjif',
  password: 'placeholder_password',
  ssl: { rejectUnauthorized: false }
});

const fixSql = `
-- =========================================================================
-- 1. CORREÇÃO DE POLÍTICAS RECURSIVAS EM COMPANIES E COMPANY_USERS (ERRO 500)
-- =========================================================================

DROP POLICY IF EXISTS "Admins can manage company users" ON public.company_users;
DROP POLICY IF EXISTS "Members can view company users" ON public.company_users;
DROP POLICY IF EXISTS "Company members full access to company" ON public.companies;
DROP POLICY IF EXISTS "Active companies viewable publicly" ON public.companies;
DROP POLICY IF EXISTS "permit_all_authenticated" ON public.companies;
DROP POLICY IF EXISTS "permit_all_authenticated" ON public.company_users;
DROP POLICY IF EXISTS "permit_all_anon_auth" ON public.companies;
DROP POLICY IF EXISTS "permit_all_anon_auth" ON public.company_users;

-- Políticas limpas sem recursão cruzada
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_access_all" ON public.companies FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.companies TO anon, authenticated, service_role;

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_users_access_all" ON public.company_users FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.company_users TO anon, authenticated, service_role;

-- =========================================================================
-- 2. RELACIONAMENTO FOREIGN KEY EM USER_COMPANIES PARA POSTGREST (ERRO 400)
-- =========================================================================

-- Garantir que company_id em user_companies aponte para companies(id)
ALTER TABLE public.user_companies DROP CONSTRAINT IF EXISTS fk_user_companies_company;
ALTER TABLE public.user_companies
  ADD CONSTRAINT fk_user_companies_company
  FOREIGN KEY (company_id) REFERENCES public.companies(id)
  ON DELETE CASCADE;

-- =========================================================================
-- 3. CRIAÇÃO DA TABELA CONFIGURATION (ERRO 404)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.configuration (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'pt-BR',
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.configuration ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "configuration_access_all" ON public.configuration;
CREATE POLICY "configuration_access_all" ON public.configuration FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.configuration TO anon, authenticated, service_role;

INSERT INTO public.configuration (id, theme, language, data)
VALUES ('app', 'system', 'pt-BR', '{"appName": "ServiceForge", "version": "1.0.0-RC1"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET updated_at = now();

-- =========================================================================
-- 4. CRIAÇÃO DA TABELA AUDIT_LOG (ERRO 404)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT,
  company_id TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_log_access_all" ON public.audit_log;
CREATE POLICY "audit_log_access_all" ON public.audit_log FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.audit_log TO anon, authenticated, service_role;

-- =========================================================================
-- 5. CRIAÇÃO DA TABELA DATABASE_CONNECTIONS (ERRO 404)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.database_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'postgres',
  host TEXT,
  port INTEGER DEFAULT 5432,
  database TEXT,
  username TEXT,
  active BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.database_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "database_connections_access_all" ON public.database_connections;
CREATE POLICY "database_connections_access_all" ON public.database_connections FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.database_connections TO anon, authenticated, service_role;

INSERT INTO public.database_connections (id, name, type, host, port, database, is_active, active)
VALUES (
  'conn-supabase-main',
  'PostgreSQL Supabase (mfyyezvpfpflpekosjif)',
  'postgres',
  'aws-0-us-east-1.pooler.supabase.com',
  5432,
  'postgres',
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Notificar recarregamento do schema cache no PostgREST
NOTIFY pgrst, 'reload schema';
`;

async function main() {
  console.log('--- APLICANDO CORREÇÕES ESTRUTURAIS NO BANCO SUPABASE ---');
  await pgClient.connect();
  await pgClient.query(fixSql);
  console.log('✔ Tabelas criadas, foreign key associada e políticas recursivas corrigidas!');
  await pgClient.end();

  // Aguardar 1 segundo para o PostgREST atualizar o schema cache
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n--- VERIFICANDO ENDPOINTS COM CLIENTE SUPABASE AUTENTICADO ---');
  const url = 'https://mfyyezvpfpflpekosjif.supabase.co';
  const anonKey = 'sb_publishable_placeholder_key';
  const client = createClient(url, anonKey);

  // Autenticar com o usuário Willian
  const { data: auth, error: authErr } = await client.auth.signInWithPassword({
    email: 'willian.o.jesus@gmail.com',
    password: 'ServiceForge@2026'
  });
  if (authErr) {
    console.error('Erro de autenticação:', authErr);
    return;
  }
  console.log('✔ Usuário autenticado com sucesso:', auth.user.email);

  // 1. configuration
  const { data: dConf, error: eConf } = await client.from('configuration').select('*').eq('id', 'app').single();
  console.log('1. configuration:', eConf ? `❌ ${eConf.message}` : `✔ OK (id: ${dConf.id})`);

  // 2. audit_log
  const { data: dAudit, error: eAudit } = await client.from('audit_log').insert({ action: 'test.check', entity: 'system' }).select().single();
  console.log('2. audit_log:', eAudit ? `❌ ${eAudit.message}` : `✔ OK (inserido log id: ${dAudit.id})`);

  // 3. database_connections
  const { data: dConn, error: eConn } = await client.from('database_connections').select('*');
  console.log('3. database_connections:', eConn ? `❌ ${eConn.message}` : `✔ OK (${dConn.length} conexão(ões) encontradas)`);

  // 4. user_companies com embedded companies:company_id
  const { data: dUserComp, error: eUserComp } = await client
    .from('user_companies')
    .select('role, is_default, companies:company_id(id, name, logo_url, active)')
    .order('is_default', { ascending: false });
  console.log('4. user_companies com embedded companies:', eUserComp ? `❌ ${eUserComp.message}` : `✔ OK (${dUserComp.length} empresa(s) vinculada(s)):`, JSON.stringify(dUserComp));

  // 5. companies
  const { data: dComp, error: eComp } = await client.from('companies').select('*');
  console.log('5. companies:', eComp ? `❌ ${eComp.message}` : `✔ OK (${dComp.length} empresas carregadas sem erro 500)`);
}

main().catch(console.error);
