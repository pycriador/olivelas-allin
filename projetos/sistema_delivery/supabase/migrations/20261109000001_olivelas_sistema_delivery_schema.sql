-- =============================================================================
-- SISTEMA_DELIVERY - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: sistema_delivery
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS sistema_delivery;



GRANT USAGE ON SCHEMA sistema_delivery TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA sistema_delivery TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA sistema_delivery TO anon, authenticated, service_role, postgres;
