-- =============================================================================
-- Adiciona 'MANUAL' ao enum payment_gateway.
--
-- Em transações separadas dos demais usos: um novo valor de enum só pode ser
-- usado em transação posterior à que o adicionou (erro 55P04). Esta migration
-- deve rodar ANTES de create_admin_payment_ledger.
-- =============================================================================

ALTER TYPE public.payment_gateway ADD VALUE IF NOT EXISTS 'MANUAL';
