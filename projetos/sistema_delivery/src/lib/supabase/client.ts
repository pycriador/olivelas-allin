import { createClient } from '@supabase/supabase-js'

/**
 * Olivelas - Central de Delivery
 * Cliente Supabase padronizado segundo a arquitetura de referência (gestao_estoque)
 * - Login Unificado: tabela public.profiles (storageKey: olivelas_supabase_auth_token)
 * - Schema Dedicado do Módulo: sistema_delivery
 */
const env: Record<string, string | undefined> =
  typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ? (import.meta as unknown as { env: Record<string, string | undefined> }).env
    : {}

export const MODULE_SCHEMA = 'sistema_delivery' as const
export const MODULE_SLUG = 'allin_delivery' as const
export const MODULE_BRAND_NAME = 'Olivelas - Central de Delivery' as const

export const supabaseUrl =
  env.VITE_SUPABASE_URL ||
  env.SUPABASE_URL ||
  'https://placeholder.supabase.co'

export const supabaseKey =
  env.VITE_SUPABASE_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  env.SUPABASE_ANON_KEY ||
  'placeholder_key'

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('placeholder') &&
  supabaseKey !== 'placeholder_key'
)

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'sistema_delivery',
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
 * Acesso dedicado ao schema PostgreSQL exclusivo deste módulo (sistema_delivery)
 */
export const moduleDb = () => supabase.schema('sistema_delivery')

/**
 * Acesso à tabela única de login e perfis do ecossistema Olivelas All In (public.profiles)
 */
export const unifiedAuthDb = () => supabase.schema('public').from('profiles')
