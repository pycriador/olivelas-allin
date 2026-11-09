-- =============================================================================
-- AGENDAMENTO_SIMPLES - MIGRATION PADRONIZADA OLIVELAS ALL IN
-- =============================================================================
-- Login unificado: public.profiles
-- Tenant corporativo: public.allin_companies
-- Schema dedicado do módulo: agendamento_simples
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS agendamento_simples;



GRANT USAGE ON SCHEMA agendamento_simples TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA agendamento_simples TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA agendamento_simples TO anon, authenticated, service_role, postgres;
