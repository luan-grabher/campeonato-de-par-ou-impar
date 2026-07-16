-- Migration: 007_paridade_inicial
-- Descrição: Adiciona coluna paridade_inicial_do_primeiro na tabela partidas
-- para persistir a paridade sorteada no início de cada partida

ALTER TABLE partidas
  ADD COLUMN paridade_inicial_do_primeiro TEXT
  CHECK (paridade_inicial_do_primeiro IN ('par', 'impar'));
