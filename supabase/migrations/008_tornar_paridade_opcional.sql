-- Migration: 008_tornar_paridade_opcional
-- Descrição: Adiciona comentários documentando que paridade pode ser NULL
-- durante o fluxo de desempate (rodada final de melhor-de-3 ou melhor-de-5)

COMMENT ON COLUMN rodadas.paridade_escolhida_pelo_primeiro IS
  'Paridade do primeiro jogador. Pode ser NULL temporariamente durante o fluxo de desempate (rodada final).';

COMMENT ON COLUMN rodadas.paridade_escolhida_pelo_segundo IS
  'Paridade do segundo jogador. Pode ser NULL temporariamente durante o fluxo de desempate (rodada final).';
