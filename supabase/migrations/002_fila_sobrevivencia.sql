-- Migration: 002_fila_sobrevivencia
-- Descrição: Criação da tabela de fila do modo sobrevivência

-- ============================================================
-- Fila de sobrevivência
-- ============================================================
CREATE TABLE IF NOT EXISTS fila_de_sobrevivencia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_do_jogador UUID NOT NULL REFERENCES perfis(id_usuario) UNIQUE,
  vitorias_consecutivas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca rápida de oponentes
CREATE INDEX IF NOT EXISTS idx_fila_sobrevivencia_jogador ON fila_de_sobrevivencia(id_do_jogador);
