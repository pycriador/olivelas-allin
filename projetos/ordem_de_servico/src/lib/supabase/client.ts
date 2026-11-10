import { createClient } from '@supabase/supabase-js'

/**
 * Olivelas - Ordens de Serviço & Assistência
 * Cliente Supabase padronizado segundo a arquitetura de referência (gestao_estoque)
 * - Login Unificado: tabela public.profiles (storageKey: olivelas_supabase_auth_token)
 * - Schema Dedicado do Módulo: ordem_de_servico
 */
const env: Record<string, string | undefined> =
  typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ? (import.meta as unknown as { env: Record<string, string | undefined> }).env
    : {}

export const MODULE_SCHEMA = 'ordem_de_servico' as const
export const MODULE_SLUG = 'allin_ordem_servico' as const
export const MODULE_BRAND_NAME = 'Olivelas - Ordens de Serviço & Assistência' as const

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
    schema: 'ordem_de_servico',
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
 * Acesso dedicado ao schema PostgreSQL exclusivo deste módulo (ordem_de_servico)
 */
export const moduleDb = () => supabase.schema('ordem_de_servico')

/**
 * Acesso à tabela única de login e perfis do ecossistema Olivelas All In (public.profiles)
 */
export const unifiedAuthDb = () => supabase.schema('public').from('profiles')
