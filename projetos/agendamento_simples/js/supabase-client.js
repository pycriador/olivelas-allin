/**
 * Olivelas - Consultório & Odonto
 * Cliente Supabase padronizado segundo a arquitetura de referência (gestao_estoque)
 * - Login Unificado: public.profiles (olivelas_supabase_auth_token)
 * - Schema Dedicado: agendamento_simples
 */
const runtimeEnv = (typeof window !== 'undefined' && window.__OLIVELAS_ENV__) || {};

export const OLIVELAS_SUPABASE_CONFIG = {
  url: runtimeEnv.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  key: runtimeEnv.VITE_SUPABASE_KEY || 'placeholder_key',
  schema: 'agendamento_simples',
  authTable: 'public.profiles',
  storageKey: 'olivelas_supabase_auth_token',
  brandName: 'Olivelas - Consultório & Odonto',
  moduleSlug: 'allin_agendamento_simples',
};

export async function queryModuleTable(table, companyId = 'comp_nebula') {
  const response = await fetch(`${OLIVELAS_SUPABASE_CONFIG.url}/rest/v1/${table}?company_id=eq.${companyId}&select=*`, {
    headers: {
      apikey: OLIVELAS_SUPABASE_CONFIG.key,
      Authorization: `Bearer ${OLIVELAS_SUPABASE_CONFIG.key}`,
      'Accept-Profile': OLIVELAS_SUPABASE_CONFIG.schema,
    },
    credentials: 'omit',
  });
  return response.ok ? response.json() : [];
}

export async function queryUnifiedProfiles() {
  const response = await fetch(`${OLIVELAS_SUPABASE_CONFIG.url}/rest/v1/profiles?select=*`, {
    headers: {
      apikey: OLIVELAS_SUPABASE_CONFIG.key,
      Authorization: `Bearer ${OLIVELAS_SUPABASE_CONFIG.key}`,
      'Accept-Profile': 'public',
    },
    credentials: 'omit',
  });
  return response.ok ? response.json() : [];
}
