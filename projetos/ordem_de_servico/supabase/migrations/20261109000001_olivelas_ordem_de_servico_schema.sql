-- =============================================================================
-- ORDEM_DE_SERVICO - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: ordem_de_servico
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS ordem_de_servico;



GRANT USAGE ON SCHEMA ordem_de_servico TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA ordem_de_servico TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ordem_de_servico TO anon, authenticated, service_role, postgres;
