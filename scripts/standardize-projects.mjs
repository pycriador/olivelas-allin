import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const projetosDir = path.join(rootDir, 'projetos');

export const OLIVELAS_PROJECTS = [
  {
    folder: 'agendamento_simples',
    schema: 'agendamento_simples',
    moduleId: 'mod_agendamento_simples',
    moduleSlug: 'allin_agendamento_simples',
    brandName: 'Olivelas - Consultório & Odonto',
    shortName: 'Consultório & Odonto',
    category: 'operations',
    primaryTable: 'appointments',
    tables: ['clinic_settings', 'plans', 'services', 'patients', 'appointments', 'messages', 'audit_logs'],
    isVanillaJs: true,
    description: 'Gestão clínica e odontológica integrada ao ecossistema Olivelas All In com agenda inteligente, planos e disparo WhatsApp.',
  },
  {
    folder: 'agendamentos',
    schema: 'agendamentos',
    moduleId: 'mod_agendamentos',
    moduleSlug: 'allin_agendamentos',
    brandName: 'Olivelas - Clínicas & Agendamentos',
    shortName: 'Clínicas & Agendamentos',
    category: 'operations',
    primaryTable: 'appointments',
    tables: ['professionals', 'locations', 'appointment_types', 'clients', 'schedules', 'appointments', 'waiting_list'],
    description: 'Plataforma multiprofissional de agendamentos clínicos, gestão de salas, escalas e lista de espera.',
  },
  {
    folder: 'app_condominio',
    schema: 'app_condominio',
    moduleId: 'mod_app_condominio',
    moduleSlug: 'allin_condominio',
    brandName: 'Olivelas - Gestão de Condomínios',
    shortName: 'Gestão de Condomínios',
    category: 'operations',
    primaryTable: 'occurrences',
    tables: ['condominiums', 'units', 'resources', 'reservations', 'announcements', 'occurrences', 'bills'],
    description: 'Administração condominial completa com unidades, reservas de áreas comuns, comunicados, ocorrências e boletos.',
  },
  {
    folder: 'art_hub',
    schema: 'art_hub',
    moduleId: 'mod_art_hub',
    moduleSlug: 'allin_art_hub',
    brandName: 'Olivelas - Art Hub & Catálogo IA',
    shortName: 'Art Hub & Catálogo IA',
    category: 'analytics',
    primaryTable: 'artworks',
    tables: ['collections', 'artworks', 'ai_prompts', 'ai_queue'],
    description: 'Curadoria de acervo artístico e catalogação inteligente assistida por IA generativa.',
  },
  {
    folder: 'casa_organizada',
    schema: 'casa_organizada',
    moduleId: 'mod_casa_organizada',
    moduleSlug: 'allin_casa_organizada',
    brandName: 'Olivelas - Casa Organizada & Rotinas',
    shortName: 'Casa Organizada & Rotinas',
    category: 'operations',
    primaryTable: 'custom_tasks',
    tables: ['household_profiles', 'global_default_tasks', 'custom_tasks', 'task_completions'],
    hasIntegrationsClient: true,
    description: 'Gestão de rotinas domésticas e operacionais por ambiente, frequência e pontuação.',
  },
  {
    folder: 'contratos',
    schema: 'contratos',
    moduleId: 'mod_contratos',
    moduleSlug: 'allin_contratos_automacao',
    brandName: 'Olivelas - Automação de Contratos',
    shortName: 'Automação de Contratos',
    category: 'finance',
    primaryTable: 'generated_documents',
    tables: ['workspaces', 'projects', 'clauses', 'generated_documents'],
    description: 'Construção dinâmica de contratos corporativos, biblioteca de cláusulas LGPD e análise de risco.',
  },
  {
    folder: 'especificacoes',
    schema: 'especificacoes',
    moduleId: 'mod_especificacoes',
    moduleSlug: 'allin_especificacoes',
    brandName: 'Olivelas - Engenharia de Especificações',
    shortName: 'Engenharia de Especificações',
    category: 'analytics',
    primaryTable: 'specifications',
    tables: ['workspaces', 'projects', 'sprints', 'specifications', 'snippets'],
    hasIntegrationsClient: true,
    description: 'Engenharia de especificações SDD, roadmaps, sprints, ADRs, RFCs e biblioteca de snippets.',
  },
  {
    folder: 'gestao_estoque',
    schema: 'gestao_estoque',
    moduleId: 'mod_gestao_estoque',
    moduleSlug: 'allin_gestao_estoque',
    brandName: 'Olivelas - Gestão de Estoque & PDV',
    shortName: 'Gestão de Estoque & PDV',
    category: 'operations',
    primaryTable: 'products',
    tables: ['stores', 'store_users', 'categories', 'suppliers', 'products', 'stock_batches', 'orders'],
    description: 'Arquitetura referência Olivelas para controle multi-loja (matriz/filial), lotes FEFO, PDV e compras.',
  },
  {
    folder: 'ordem_de_servico',
    schema: 'ordem_de_servico',
    moduleId: 'mod_ordem_de_servico',
    moduleSlug: 'allin_ordem_servico',
    brandName: 'Olivelas - Ordens de Serviço & Assistência',
    shortName: 'Ordens de Serviço & Assistência',
    category: 'operations',
    primaryTable: 'service_orders',
    tables: ['customers', 'devices', 'technicians', 'service_orders'],
    description: 'Gestão de assistência técnica, ordens de serviço, diagnósticos de bancada, peças e garantias.',
  },
  {
    folder: 'personal_treiner',
    schema: 'personal_treiner',
    moduleId: 'mod_personal_treiner',
    moduleSlug: 'allin_personal_trainer',
    brandName: 'Olivelas - Personal Trainer',
    shortName: 'Personal Trainer',
    category: 'operations',
    primaryTable: 'students',
    tables: ['trainers', 'students', 'exercises', 'workout_plans', 'nutrition_plans'],
    description: 'Prescrição de treinos periodizados, avaliação física, nutrição esportiva e evolução de alunos.',
  },
  {
    folder: 'restaurante',
    schema: 'restaurante',
    moduleId: 'mod_restaurante',
    moduleSlug: 'allin_restaurante',
    brandName: 'Olivelas - Gestão de Restaurantes & KDS',
    shortName: 'Gestão de Restaurantes & KDS',
    category: 'operations',
    primaryTable: 'orders',
    tables: ['restaurants', 'products', 'restaurant_tables', 'orders'],
    description: 'Operação gastronômica com mapa de mesas, comandas digitais, KDS por praça e controle de salão.',
  },
  {
    folder: 'rifas',
    schema: 'rifas',
    moduleId: 'mod_rifas',
    moduleSlug: 'allin_rifas',
    brandName: 'Olivelas - Rifas & Sorteios Digitais',
    shortName: 'Rifas & Sorteios Digitais',
    category: 'finance',
    primaryTable: 'campaigns',
    tables: ['campaigns', 'orders'],
    description: 'Gestão de campanhas de sorteios digitais, venda de cotas, conciliação PIX e auditoria.',
  },
  {
    folder: 'sistema_delivery',
    schema: 'sistema_delivery',
    moduleId: 'mod_sistema_delivery',
    moduleSlug: 'allin_delivery',
    brandName: 'Olivelas - Central de Delivery',
    shortName: 'Central de Delivery',
    category: 'operations',
    primaryTable: 'delivery_orders',
    tables: ['stores', 'couriers', 'delivery_orders'],
    description: 'Torre de controle de delivery, despacho de entregadores, SLA logístico e integração omnichannel.',
  },
  {
    folder: 'sistema_mercado',
    schema: 'sistema_mercado',
    moduleId: 'mod_sistema_mercado',
    moduleSlug: 'allin_mercado',
    brandName: 'Olivelas - Supermercado & Cestas',
    shortName: 'Supermercado & Cestas',
    category: 'operations',
    primaryTable: 'breakfast_baskets',
    tables: ['products', 'breakfast_baskets', 'catalog_requests'],
    description: 'Gestão de supermercado, montagem de cestas especiais, controle de validade e encomendas.',
  },
  {
    folder: 'suite_rifa',
    schema: 'suite_rifa',
    moduleId: 'mod_suite_rifa',
    moduleSlug: 'allin_suite_rifa',
    brandName: 'Olivelas - Suíte Multi-Organização de Rifas',
    shortName: 'Suíte Multi-Organização de Rifas',
    category: 'finance',
    primaryTable: 'campaigns',
    tables: ['organizations', 'campaigns'],
    description: 'Suíte corporativa multi-organização para gestão de campanhas de sorteios em larga escala.',
  },
  {
    folder: 'vitrine_digital',
    schema: 'vitrine_digital',
    moduleId: 'mod_vitrine_digital',
    moduleSlug: 'allin_vitrine_digital',
    brandName: 'Olivelas - Vitrine Digital & Analisador IA',
    shortName: 'Vitrine Digital & Analisador IA',
    category: 'analytics',
    primaryTable: 'art_submissions',
    tables: ['art_submissions', 'image_analysis'],
    description: 'Vitrine digital inteligente com análise de qualidade fotográfica por IA e geração de SEO.',
  },
];

function buildTsSupabaseClient(proj) {
  return `import { createClient } from '@supabase/supabase-js'

/**
 * ${proj.brandName}
 * Cliente Supabase padronizado segundo a arquitetura de referência (gestao_estoque)
 * - Login Unificado: tabela public.profiles (storageKey: olivelas_supabase_auth_token)
 * - Schema Dedicado do Módulo: ${proj.schema}
 */
const env: Record<string, string | undefined> =
  typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ? (import.meta as unknown as { env: Record<string, string | undefined> }).env
    : {}

export const MODULE_SCHEMA = '${proj.schema}' as const
export const MODULE_SLUG = '${proj.moduleSlug}' as const
export const MODULE_BRAND_NAME = '${proj.brandName}' as const

export const supabaseUrl =
  env['VITE_SUPABASE_URL'] ||
  env['SUPABASE_URL'] ||
  'https://placeholder.supabase.co'

export const supabaseKey =
  env['VITE_SUPABASE_KEY'] ||
  env['VITE_SUPABASE_PUBLISHABLE_KEY'] ||
  env['SUPABASE_PUBLISHABLE_KEY'] ||
  env['VITE_SUPABASE_ANON_KEY'] ||
  env['SUPABASE_ANON_KEY'] ||
  'placeholder_key'

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('placeholder') &&
  supabaseKey !== 'placeholder_key'
)

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: '${proj.schema === 'gestao_estoque' ? 'public' : proj.schema}',
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'olivelas_supabase_auth_token',
  },
  global: {
    fetch: (input, init) => fetch(input, { ...init, credentials: 'omit' }),
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

/**
 * Acesso dedicado ao schema PostgreSQL exclusivo deste módulo (${proj.schema})
 */
export const moduleDb = () => supabase.schema('${proj.schema}')

/**
 * Acesso à tabela única de login e perfis do ecossistema Olivelas All In (public.profiles)
 */
export const unifiedAuthDb = () => supabase.schema('public').from('profiles')
`;
}

function buildVanillaJsSupabaseClient(proj) {
  return `/**
 * ${proj.brandName}
 * Cliente Supabase padronizado segundo a arquitetura de referência (gestao_estoque)
 * - Login Unificado: public.profiles (olivelas_supabase_auth_token)
 * - Schema Dedicado: ${proj.schema}
 */
(function () {
  var runtimeEnv = (typeof window !== 'undefined' && window.__OLIVELAS_ENV__) || {};

  var OLIVELAS_SUPABASE_CONFIG = {
    url: runtimeEnv.VITE_SUPABASE_URL || localStorage.getItem('olivelas_supabase_url') || 'https://placeholder.supabase.co',
    key: runtimeEnv.VITE_SUPABASE_KEY || localStorage.getItem('olivelas_supabase_key') || 'placeholder_key',
    schema: '${proj.schema}',
    authTable: 'public.profiles',
    storageKey: 'olivelas_supabase_auth_token',
    brandName: '${proj.brandName}',
    moduleSlug: '${proj.moduleSlug}'
  };

  window.OLIVELAS_SUPABASE_CONFIG = OLIVELAS_SUPABASE_CONFIG;

  var isConfigured =
    OLIVELAS_SUPABASE_CONFIG.url &&
    OLIVELAS_SUPABASE_CONFIG.key &&
    OLIVELAS_SUPABASE_CONFIG.url.indexOf('placeholder') === -1 &&
    OLIVELAS_SUPABASE_CONFIG.key !== 'placeholder_key';

  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function' && isConfigured) {
    try {
      window.supabaseClient = window.supabase.createClient(
        OLIVELAS_SUPABASE_CONFIG.url,
        OLIVELAS_SUPABASE_CONFIG.key,
        {
          db: { schema: OLIVELAS_SUPABASE_CONFIG.schema },
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: OLIVELAS_SUPABASE_CONFIG.storageKey
          }
        }
      );
    } catch (err) {
      console.warn('[Olivelas Supabase] Aviso ao inicializar cliente:', err);
      window.supabaseClient = null;
    }
  } else {
    window.supabaseClient = null;
  }

  var AuthService = {
    async login(email, password) {
      if (window.supabaseClient && window.supabaseClient.auth) {
        try {
          var res = await window.supabaseClient.auth.signInWithPassword({ email: email, password: password });
          if (!res.error && res.data && res.data.session) {
            if (typeof StorageService !== 'undefined') {
              StorageService.setSession({
                id: res.data.user.id,
                name: (res.data.user.user_metadata && res.data.user.user_metadata.name) || 'Dra. Marta Gelsi Dias',
                email: res.data.user.email,
                role: 'Cirurgiã-Dentista / Administradora'
              });
            }
            return res.data;
          }
        } catch (e) {
          console.warn('[AuthService] Fallback local ativado:', e);
        }
      }

      if (!email || !password) {
        throw new Error('Informe e-mail e senha válidos.');
      }

      var fallbackUser = {
        id: 'USR-001',
        email: email,
        name: 'Dra. Marta Gelsi Dias',
        user_metadata: { name: 'Dra. Marta Gelsi Dias', role: 'admin' },
        role: 'Cirurgiã-Dentista / Administradora'
      };

      if (typeof StorageService !== 'undefined') {
        StorageService.setSession(fallbackUser);
      }

      return { user: fallbackUser, session: { user: fallbackUser } };
    },

    async getSession() {
      if (window.supabaseClient && window.supabaseClient.auth) {
        try {
          var res = await window.supabaseClient.auth.getSession();
          if (res && res.data && res.data.session) {
            return res.data.session;
          }
        } catch (e) {
          // fallback
        }
      }

      if (typeof StorageService !== 'undefined') {
        var localUser = StorageService.getSession();
        if (localUser) {
          return {
            user: {
              id: localUser.id || 'USR-001',
              email: localUser.email || 'admin@dramartagelsi.com.br',
              user_metadata: { name: localUser.name || 'Dra. Marta Gelsi Dias', role: 'admin' }
            }
          };
        }
      }

      var defaultUser = {
        id: 'USR-001',
        email: 'admin@dramartagelsi.com.br',
        name: 'Dra. Marta Gelsi Dias',
        user_metadata: { name: 'Dra. Marta Gelsi Dias', role: 'admin' }
      };
      if (typeof StorageService !== 'undefined') {
        StorageService.setSession(defaultUser);
      }
      return { user: defaultUser };
    },

    async getUser() {
      var session = await AuthService.getSession();
      return session ? session.user : null;
    },

    async logout() {
      if (window.supabaseClient && window.supabaseClient.auth) {
        try {
          await window.supabaseClient.auth.signOut();
        } catch (e) {
          // ignore
        }
      }
      if (typeof StorageService !== 'undefined') {
        StorageService.clearSession();
      }
      var isInsidePages = window.location.pathname.indexOf('/pages/') !== -1;
      window.location.href = isInsidePages ? '../login.html' : 'login.html';
    }
  };

  window.AuthService = AuthService;

  window.queryModuleTable = async function (table, companyId) {
    var cid = companyId || 'comp_nebula';
    if (!isConfigured) return [];
    var response = await fetch(
      OLIVELAS_SUPABASE_CONFIG.url + '/rest/v1/' + table + '?company_id=eq.' + cid + '&select=*',
      {
        headers: {
          apikey: OLIVELAS_SUPABASE_CONFIG.key,
          Authorization: 'Bearer ' + OLIVELAS_SUPABASE_CONFIG.key,
          'Accept-Profile': OLIVELAS_SUPABASE_CONFIG.schema
        },
        credentials: 'omit'
      }
    );
    return response.ok ? response.json() : [];
  };

  window.queryUnifiedProfiles = async function () {
    if (!isConfigured) return [];
    var response = await fetch(OLIVELAS_SUPABASE_CONFIG.url + '/rest/v1/profiles?select=*', {
      headers: {
        apikey: OLIVELAS_SUPABASE_CONFIG.key,
        Authorization: 'Bearer ' + OLIVELAS_SUPABASE_CONFIG.key,
        'Accept-Profile': 'public'
      },
      credentials: 'omit'
    });
    return response.ok ? response.json() : [];
  };
})();
`;
}

function extractSchemaMigration(fullMigrationSql, schemaName) {
  const markerStart = `-- SCHEMA: ${schemaName} (`;
  const startIdx = fullMigrationSql.indexOf(markerStart);
  let sectionSql = '';
  if (startIdx !== -1) {
    const lineStart = fullMigrationSql.lastIndexOf('-- ===', startIdx);
    const nextMarker = fullMigrationSql.indexOf('-- =============================================================================\n-- ', startIdx + markerStart.length);
    sectionSql = nextMarker !== -1 ? fullMigrationSql.slice(lineStart, nextMarker) : fullMigrationSql.slice(lineStart);
  }
  return `-- =============================================================================
-- ${schemaName.toUpperCase()} - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: ${schemaName}
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS ${schemaName};

${sectionSql.trim()}

GRANT USAGE ON SCHEMA ${schemaName} TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA ${schemaName} TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ${schemaName} TO anon, authenticated, service_role, postgres;
`;
}

function main() {
  const fullMigration2 = fs.readFileSync(
    path.join(rootDir, 'supabase', 'migrations', '20261109000002_all_16_project_schemas.sql'),
    'utf8'
  );

  const rootEnvPath = path.join(rootDir, '.env');
  const rootEnvContent = fs.existsSync(rootEnvPath) ? fs.readFileSync(rootEnvPath, 'utf8').trim() : '';

  for (const proj of OLIVELAS_PROJECTS) {
    const projDir = path.join(projetosDir, proj.folder);
    if (!fs.existsSync(projDir)) {
      console.warn(`⚠️ Diretório não encontrado: ${projDir}`);
      continue;
    }

    // Remove .git aninhado para garantir publicação única no monorepo olivelas-allin
    const nestedGitDir = path.join(projDir, '.git');
    if (fs.existsSync(nestedGitDir)) {
      fs.rmSync(nestedGitDir, { recursive: true, force: true });
    }

    // 1. Cria .env padronizado em cada projeto (ignorado pelo Git) se .env raiz existir
    if (rootEnvContent) {
      const envMap = Object.fromEntries(
        rootEnvContent
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith('#') && l.includes('='))
          .map((l) => {
            const idx = l.indexOf('=');
            return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
          })
      );
      const sbUrl = envMap.VITE_SUPABASE_URL || '';
      const sbKey = envMap.VITE_SUPABASE_KEY || envMap.VITE_SUPABASE_PUBLISHABLE_KEY || '';
      const projEnv = `${rootEnvContent}
SUPABASE_URL=${sbUrl}
SUPABASE_PUBLISHABLE_KEY=${sbKey}
SUPABASE_ANON_KEY=${sbKey}
SUPABASE_SERVICE_ROLE_KEY=${sbKey}
VITE_SUPABASE_SCHEMA=${proj.schema}
VITE_OLIVELAS_APP_NAME="${proj.brandName}"
VITE_OLIVELAS_MODULE_SLUG=${proj.moduleSlug}
VITE_OLIVELAS_AUTH_TABLE=public.profiles
`;
      fs.writeFileSync(path.join(projDir, '.env'), projEnv, 'utf8');
    }

    // 2. Cria migration padronizada em projetos/<proj>/supabase/migrations/
    const projMigrationsDir = path.join(projDir, 'supabase', 'migrations');
    fs.mkdirSync(projMigrationsDir, { recursive: true });
    const migrationSql = extractSchemaMigration(fullMigration2, proj.schema);
    fs.writeFileSync(
      path.join(projMigrationsDir, `20261109000001_olivelas_${proj.schema}_schema.sql`),
      migrationSql,
      'utf8'
    );

    // 3. Cria/atualiza o cliente Supabase padronizado seguindo gestao_estoque
    if (proj.isVanillaJs) {
      const jsDir = path.join(projDir, 'js');
      fs.mkdirSync(jsDir, { recursive: true });
      fs.writeFileSync(path.join(jsDir, 'supabase-client.js'), buildVanillaJsSupabaseClient(proj), 'utf8');
    } else {
      const libSupabaseDir = path.join(projDir, 'src', 'lib', 'supabase');
      fs.mkdirSync(libSupabaseDir, { recursive: true });
      const clientCode = buildTsSupabaseClient(proj);
      fs.writeFileSync(path.join(libSupabaseDir, 'client.ts'), clientCode, 'utf8');

      if (proj.hasIntegrationsClient) {
        const intSupabaseDir = path.join(projDir, 'src', 'integrations', 'supabase');
        fs.mkdirSync(intSupabaseDir, { recursive: true });
        fs.writeFileSync(path.join(intSupabaseDir, 'client.ts'), clientCode, 'utf8');
      }
    }

    // 4. Padroniza package.json (se existir) com o nome e metadados Olivelas
    const pkgPath = path.join(projDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        pkg.description = proj.brandName + ' — ' + proj.description;
        pkg.olivelas = {
          brandName: proj.brandName,
          moduleId: proj.moduleId,
          moduleSlug: proj.moduleSlug,
          dbSchema: proj.schema,
          unifiedAuthTable: 'public.profiles',
          referenceArchitecture: 'gestao_estoque',
        };
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
      } catch (e) {
        console.warn(`Aviso ao atualizar package.json em ${proj.folder}:`, e.message);
      }
    }

    // 5. Padroniza <title> no index.html (se existir)
    const indexHtmlPath = path.join(projDir, 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      const html = fs.readFileSync(indexHtmlPath, 'utf8');
      const updatedHtml = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${proj.brandName}</title>`);
      fs.writeFileSync(indexHtmlPath, updatedHtml, 'utf8');
    }

    console.log(`✅ Projeto padronizado: ${proj.folder.padEnd(20)} -> ${proj.brandName} (schema: ${proj.schema})`);
  }
}

main();
