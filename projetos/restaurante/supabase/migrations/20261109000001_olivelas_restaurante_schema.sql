-- =============================================================================
-- RESTAURANTE - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: restaurante
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS restaurante;



GRANT USAGE ON SCHEMA restaurante TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA restaurante TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA restaurante TO anon, authenticated, service_role, postgres;
