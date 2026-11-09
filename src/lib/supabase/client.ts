import { createClient } from '@supabase/supabase-js';

/**
 * Olivelas All In — Cliente Supabase Unificado
 * Padronizado a partir da arquitetura de referência (projetos/gestao_estoque/src/lib/supabase/client.ts).
 * - Login Unificado: tabela única `public.profiles` (storageKey: `olivelas_supabase_auth_token`)
 * - Multi-Schema PostgreSQL: acesso nativo aos 16 schemas dedicados via `supabase.schema('<schema>')`
 */
const env: Record<string, string | undefined> =
  typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ? (import.meta as unknown as { env: Record<string, string | undefined> }).env
    : {};

export const supabaseUrl =
  env.VITE_SUPABASE_URL ||
  env.SUPABASE_URL ||
  'https://placeholder.supabase.co';

export const supabaseKey =
  env.VITE_SUPABASE_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  env.SUPABASE_ANON_KEY ||
  'placeholder_key';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('placeholder') &&
    supabaseKey !== 'placeholder_key',
);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
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
});

/**
 * Retorna um cliente apontando para o schema PostgreSQL exclusivo de um dos 16 módulos Olivelas
 */
export function getProjectSchemaClient(schemaName: string) {
  return supabase.schema(schemaName);
}

/**
 * Retorna a tabela única de login e perfis de usuários do ecossistema Olivelas (public.profiles)
 */
export function getUnifiedProfilesTable() {
  return supabase.schema('public').from('profiles');
}
