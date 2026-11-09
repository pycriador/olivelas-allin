import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const url = 'https://mfyyezvpfpflpekosjif.supabase.co';
const serviceKey = 'sb_secret_placeholder_key';
const adminClient = createClient(url, serviceKey);

const { Client } = pg;
const pgClient = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.mfyyezvpfpflpekosjif',
  password: 'placeholder_password',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('--- CONFIGURANDO USUÁRIO WILLIAN OLIVEIRA NO SUPABASE ---');

  const userId = '72d7e554-a19e-4c5d-b59b-4bb0b394417f';
  const email = 'willian.o.jesus@gmail.com';
  const defaultPassword = 'ServiceForge@2026';

  // 1. Atualizar usuário via Admin Auth: confirmar email, definir senha e metadata
  const { data: updatedUser, error: errAuth } = await adminClient.auth.admin.updateUserById(userId, {
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      full_name: 'Willian Oliveira',
      name: 'Willian Oliveira',
      role: 'global_admin',
      email_verified: true
    }
  });

  if (errAuth) {
    console.error('Erro no update auth admin:', errAuth);
  } else {
    console.log(`✔ Senha definida com sucesso para ${email}: "${defaultPassword}"`);
    console.log(`✔ Email confirmado e perfil atualizado com papel global_admin.`);
  }

  // 2. Conectar ao PostgreSQL para vincular empresas e criar trigger de auto-confirmação
  await pgClient.connect();

  // Trigger para auto-confirmar qualquer novo usuário (evitando falha de email SMTP)
  await pgClient.query(`
    CREATE OR REPLACE FUNCTION public.auto_confirm_user()
    RETURNS trigger AS $$
    BEGIN
      NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, now());
      NEW.confirmed_at = COALESCE(NEW.confirmed_at, now());
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS tr_auto_confirm_user ON auth.users;
    CREATE TRIGGER tr_auto_confirm_user
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();
  `);
  console.log('✔ Trigger de auto-confirmação de email instalada no PostgreSQL.');

  // Vincular à empresa ServiceForge Matriz na tabela user_companies
  await pgClient.query(`
    INSERT INTO public.user_companies (id, user_id, company_id, role, is_default)
    VALUES ('uc-willian-1', $1, '00000000-0000-0000-0000-000000000001', 'global_admin', true)
    ON CONFLICT (id) DO UPDATE SET role = 'global_admin', is_default = true;
  `, [userId]);

  await pgClient.query(`
    INSERT INTO public.company_users (id, user_id, company_id, role, active)
    VALUES ('cu-willian-1', $1, '00000000-0000-0000-0000-000000000001', 'admin', true)
    ON CONFLICT (id) DO UPDATE SET active = true;
  `, [userId]);
  console.log('✔ Vínculo com a empresa ServiceForge Matriz configurado com sucesso.');

  // Gerar link de login direto (Magic Link)
  const { data: linkData } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: 'http://localhost:8080/dashboard'
    }
  });

  console.log('\n========================================================');
  console.log('🔑 DADOS DE ACESSO PARA willian.o.jesus@gmail.com:');
  console.log(`Email: ${email}`);
  console.log(`Senha definida: ${defaultPassword}`);
  console.log(`Link de Acesso Direto (1-Clique):`);
  console.log(linkData?.properties?.action_link);
  console.log('========================================================\n');

  await pgClient.end();
}

main().catch(console.error);
