import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function loadEnv(envPath) {
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const val = line.slice(eqIndex + 1).trim();
    env[key] = val;
  }
  return env;
}

async function runMigrations() {
  const env = { ...process.env, ...loadEnv(path.join(rootDir, '.env')) };
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !env.db_password) {
    throw new Error(
      'Credenciais não encontradas. Configure VITE_SUPABASE_URL, VITE_SUPABASE_KEY e db_password no arquivo .env (veja .env.example).'
    );
  }

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const poolerHost = env.db_pooler_host || env.db_host;
  const dbPort = Number(env.db_port || 5432);
  const dbDatabase = env.db_database || 'postgres';
  const dbUser = env.db_user?.includes('.') ? env.db_user : `${env.db_user || 'postgres'}.${projectRef}`;
  const dbPassword = env.db_password;

  console.log(`🚀 Conectando ao Supabase PostgreSQL (${poolerHost}:${dbPort}, projeto: ${projectRef})...`);

  const client = new Client({
    host: poolerHost,
    port: dbPort,
    database: dbDatabase,
    user: dbUser,
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    console.log(`📦 Aplicando migration: ${file}...`);
    await client.query(sql);
    console.log(`✅ Migration concluída: ${file}`);
  }

  const expectedSchemas = [
    'public',
    'agendamento_simples',
    'agendamentos',
    'app_condominio',
    'art_hub',
    'casa_organizada',
    'contratos',
    'especificacoes',
    'gestao_estoque',
    'ordem_de_servico',
    'personal_treiner',
    'restaurante',
    'rifas',
    'sistema_delivery',
    'sistema_mercado',
    'suite_rifa',
    'vitrine_digital',
  ];

  const schemaSummary = await client.query(
    `
    SELECT table_schema, COUNT(*)::int AS tables_count
    FROM information_schema.tables
    WHERE table_schema = ANY($1::text[])
      AND table_type IN ('BASE TABLE', 'VIEW')
    GROUP BY table_schema
    ORDER BY table_schema;
  `,
    [expectedSchemas]
  );

  console.log('\n📊 Resumo de Schemas e Tabelas no Supabase:');
  for (const row of schemaSummary.rows) {
    console.log(`  • ${row.table_schema.padEnd(22)} -> ${row.tables_count} tabelas/views`);
  }

  const profilesCount = await client.query('SELECT COUNT(*)::int AS count FROM public.profiles;');
  const modulesCount = await client.query('SELECT COUNT(*)::int AS count FROM public.allin_modules;');
  console.log(`\n🔐 Login Unificado (public.profiles): ${profilesCount.rows[0].count} usuários ativos`);
  console.log(`🧩 Módulos Olivelas (public.allin_modules): ${modulesCount.rows[0].count} módulos registrados`);

  await client.end();

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        fetch: (input, init) => fetch(input, { ...init, credentials: 'omit' }),
      },
    });
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, email, full_name, is_global_admin');
    if (pErr) {
      console.warn('⚠️ Aviso REST public.profiles:', pErr.message);
    } else {
      console.log(`🌐 Verificação REST API public.profiles OK (${profiles?.length ?? 0} perfis retornados)`);
    }

    const { data: trainerStudents, error: sErr } = await supabase
      .schema('personal_treiner')
      .from('students')
      .select('id, full_name, plan_name');
    if (sErr) {
      console.warn('⚠️ Aviso REST schema personal_treiner:', sErr.message);
    } else {
      console.log(`🌐 Verificação REST API schema personal_treiner.students OK (${trainerStudents?.length ?? 0} registros)`);
    }
  }
}

runMigrations().catch((err) => {
  console.error('❌ Erro ao aplicar migrations no Supabase:', err);
  process.exit(1);
});
