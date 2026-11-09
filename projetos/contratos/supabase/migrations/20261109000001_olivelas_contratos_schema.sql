-- =============================================================================
-- CONTRATOS - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: contratos
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS contratos;



GRANT USAGE ON SCHEMA contratos TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA contratos TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA contratos TO anon, authenticated, service_role, postgres;
