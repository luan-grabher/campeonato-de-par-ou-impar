-- Migration: 010_timeout_nas_rodadas
-- Descrição: Adiciona colunas de timeout para permitir derrota automática
-- quando o jogador não faz jogada a tempo (anti-farming).

ALTER TABLE rodadas
  ADD COLUMN timeout_do_primeiro boolean NOT NULL DEFAULT false,
  ADD COLUMN timeout_do_segundo boolean NOT NULL DEFAULT false;
