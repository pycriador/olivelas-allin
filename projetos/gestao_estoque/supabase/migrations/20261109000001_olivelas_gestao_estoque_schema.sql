-- =============================================================================
-- GESTAO_ESTOQUE - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: gestao_estoque
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS gestao_estoque;



GRANT USAGE ON SCHEMA gestao_estoque TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA gestao_estoque TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA gestao_estoque TO anon, authenticated, service_role, postgres;
