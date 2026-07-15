-- Migration: 003_temporadas_status
-- Descrição: Adiciona coluna status à tabela temporadas para controle explícito
-- de temporadas ativas/finalizadas, além do histórico de elo dos jogadores

-- ============================================================
-- Adicionar status à tabela temporadas
-- ============================================================
ALTER TABLE temporadas
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ativa'
  CHECK (status IN ('ativa', 'finalizada'));
