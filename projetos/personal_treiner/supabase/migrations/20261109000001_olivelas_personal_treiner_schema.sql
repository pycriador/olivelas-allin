-- =============================================================================
-- PERSONAL_TREINER - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: personal_treiner
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS personal_treiner;



GRANT USAGE ON SCHEMA personal_treiner TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA personal_treiner TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA personal_treiner TO anon, authenticated, service_role, postgres;
