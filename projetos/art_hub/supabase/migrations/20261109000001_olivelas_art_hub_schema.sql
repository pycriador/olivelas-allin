-- =============================================================================
-- ART_HUB - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: art_hub
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS art_hub;



GRANT USAGE ON SCHEMA art_hub TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA art_hub TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA art_hub TO anon, authenticated, service_role, postgres;
