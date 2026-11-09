-- =============================================================================
-- APP_CONDOMINIO - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: app_condominio
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS app_condominio;



GRANT USAGE ON SCHEMA app_condominio TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA app_condominio TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app_condominio TO anon, authenticated, service_role, postgres;
