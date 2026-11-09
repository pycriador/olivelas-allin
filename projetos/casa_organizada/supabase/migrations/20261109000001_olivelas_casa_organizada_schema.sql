-- =============================================================================
-- CASA_ORGANIZADA - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: casa_organizada
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS casa_organizada;



GRANT USAGE ON SCHEMA casa_organizada TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA casa_organizada TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA casa_organizada TO anon, authenticated, service_role, postgres;
