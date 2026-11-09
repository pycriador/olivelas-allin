-- =============================================================================
-- VITRINE_DIGITAL - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: vitrine_digital
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS vitrine_digital;



GRANT USAGE ON SCHEMA vitrine_digital TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA vitrine_digital TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA vitrine_digital TO anon, authenticated, service_role, postgres;
