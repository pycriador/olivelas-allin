-- =============================================================================
-- AGENDAMENTOS - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: agendamentos
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS agendamentos;



GRANT USAGE ON SCHEMA agendamentos TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA agendamentos TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA agendamentos TO anon, authenticated, service_role, postgres;
