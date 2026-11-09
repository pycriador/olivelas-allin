-- =============================================================================
-- RIFAS - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: rifas
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS rifas;



GRANT USAGE ON SCHEMA rifas TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA rifas TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA rifas TO anon, authenticated, service_role, postgres;
