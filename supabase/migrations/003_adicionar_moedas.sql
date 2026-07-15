-- Migration: 003_adicionar_moedas
-- Descrição: Adiciona campo de moedas virtuais aos perfis dos jogadores

-- ============================================================
-- Adicionar coluna moedas à tabela perfis
-- ============================================================
ALTER TABLE perfis
ADD COLUMN IF NOT EXISTS moedas INTEGER NOT NULL DEFAULT 0;
