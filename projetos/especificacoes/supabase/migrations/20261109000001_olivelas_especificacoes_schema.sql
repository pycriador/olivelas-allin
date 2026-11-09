-- =============================================================================
-- ESPECIFICACOES - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: especificacoes
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS especificacoes;



GRANT USAGE ON SCHEMA especificacoes TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA especificacoes TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA especificacoes TO anon, authenticated, service_role, postgres;
