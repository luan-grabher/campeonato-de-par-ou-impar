-- Seed: Dados iniciais do Campeonato de Par ou Ímpar
-- Conquistas, Cosméticos e Faixas de Elo

-- ============================================================
-- REFERÊNCIA: Faixas de Elo
-- (não são uma tabela; usadas para cálculo de ranking no frontend)
-- ============================================================
-- Bronze:     0 — 999
-- Prata:      1.000 — 1.399
-- Ouro:       1.400 — 1.699
-- Platina:    1.700 — 1.999
-- Diamante:   2.000 — 2.299
-- Mestre:     2.300 — 2.699
-- Lendário:   2.700+

-- ============================================================
-- Conquistas iniciais
-- ============================================================
INSERT INTO conquistas (id, nome, descricao, icone, condicao_json) VALUES
  -- Vitórias
  ('c0000000-0000-0000-0000-000000000001', 'Primeira Vitória',
   'Vença sua primeira partida',
   'trophy', '{"tipo": "vitorias", "operador": ">=", "valor": 1}'),

  ('c0000000-0000-0000-0000-000000000002', 'Colecionador de Vitórias',
   'Vença 10 partidas',
   'trophy', '{"tipo": "vitorias", "operador": ">=", "valor": 10}'),

  ('c0000000-0000-0000-0000-000000000003', 'Veterano',
   'Vença 100 partidas',
   'trophy', '{"tipo": "vitorias", "operador": ">=", "valor": 100}'),

  ('c0000000-0000-0000-0000-000000000004', 'Lenda Viva',
   'Vença 1.000 partidas',
   'trophy', '{"tipo": "vitorias", "operador": ">=", "valor": 1000}'),

  -- Sequências
  ('c0000000-0000-0000-0000-000000000005', 'Em Chamas',
   'Consiga uma sequência de 5 vitórias consecutivas',
   'flame', '{"tipo": "sequencia_maxima", "operador": ">=", "valor": 5}'),

  ('c0000000-0000-0000-0000-000000000006', 'Imparável',
   'Consiga uma sequência de 10 vitórias consecutivas',
   'flame', '{"tipo": "sequencia_maxima", "operador": ">=", "valor": 10}'),

  ('c0000000-0000-0000-0000-000000000007', 'Lendário Imparável',
   'Consiga uma sequência de 20 vitórias consecutivas',
   'flame', '{"tipo": "sequencia_maxima", "operador": ">=", "valor": 20}'),

  -- Elo
  ('c0000000-0000-0000-0000-000000000008', 'Bronze',
   'Alcance o elo Bronze',
   'shield', '{"tipo": "elo", "operador": ">=", "valor": 0}'),

  ('c0000000-0000-0000-0000-000000000009', 'Prata',
   'Alcance o elo Prata',
   'shield', '{"tipo": "elo", "operador": ">=", "valor": 1000}'),

  ('c0000000-0000-0000-0000-000000000010', 'Ouro',
   'Alcance o elo Ouro',
   'shield', '{"tipo": "elo", "operador": ">=", "valor": 1400}'),

  ('c0000000-0000-0000-0000-000000000011', 'Platina',
   'Alcance o elo Platina',
   'shield', '{"tipo": "elo", "operador": ">=", "valor": 1700}'),

  ('c0000000-0000-0000-0000-000000000012', 'Diamante',
   'Alcance o elo Diamante',
   'shield', '{"tipo": "elo", "operador": ">=", "valor": 2000}'),

  ('c0000000-0000-0000-0000-000000000013', 'Mestre',
   'Alcance o elo Mestre',
   'shield', '{"tipo": "elo", "operador": ">=", "valor": 2300}'),

  ('c0000000-0000-0000-0000-000000000014', 'Lendário',
   'Alcance o elo Lendário',
   'shield', '{"tipo": "elo", "operador": ">=", "valor": 2700}'),

  -- Campeonatos
  ('c0000000-0000-0000-0000-000000000015', 'Campeão Iniciante',
   'Vença 1 campeonato',
   'crown', '{"tipo": "campeonatos_vencidos", "operador": ">=", "valor": 1}'),

  ('c0000000-0000-0000-0000-000000000016', 'Campeão Experiente',
   'Vença 5 campeonatos',
   'crown', '{"tipo": "campeonatos_vencidos", "operador": ">=", "valor": 5}'),

  ('c0000000-0000-0000-0000-000000000017', 'Campeão Supremo',
   'Vença 10 campeonatos',
   'crown', '{"tipo": "campeonatos_vencidos", "operador": ">=", "valor": 10}'),

  -- Modos de jogo
  ('c0000000-0000-0000-0000-000000000018', 'Relâmpago',
   'Vença uma partida no modo Relâmpago',
   'lightning', '{"tipo": "vitorias_modo", "modo": "relampago", "operador": ">=", "valor": 1}'),

  ('c0000000-0000-0000-0000-000000000019', 'Caótico',
   'Vença uma partida no modo Caos',
   'skull', '{"tipo": "vitorias_modo", "modo": "caos", "operador": ">=", "valor": 1}'),

  ('c0000000-0000-0000-0000-000000000020', 'Invisível',
   'Vença uma partida no modo Invisível',
   'ghost', '{"tipo": "vitorias_modo", "modo": "invisivel", "operador": ">=", "valor": 1}'),

  ('c0000000-0000-0000-0000-000000000021', 'Sobrevivente',
   'Vença uma partida no modo Sobrevivência',
   'heart', '{"tipo": "vitorias_modo", "modo": "sobrevivencia", "operador": ">=", "valor": 1}'),

  -- Partidas totais
  ('c0000000-0000-0000-0000-000000000022', 'Maratona',
   'Jogue 500 partidas no total',
   'clock', '{"tipo": "partidas_totais", "operador": ">=", "valor": 500}'),

  -- Amigos
  ('c0000000-0000-0000-0000-000000000023', 'Social',
   'Tenha 10 amigos adicionados',
   'users', '{"tipo": "total_amigos", "operador": ">=", "valor": 10}'),

  ('c0000000-0000-0000-0000-000000000024', 'Popular',
   'Tenha 50 amigos adicionados',
   'users', '{"tipo": "total_amigos", "operador": ">=", "valor": 50}'),

  -- Número favorito
  ('c0000000-0000-0000-0000-000000000025', 'Sorte Grande',
   'Vença uma partida usando seu número favorito em todas as rodadas',
   'clover', '{"tipo": "numero_favorito_todas_rodadas", "operador": ">=", "valor": 1}');

-- ============================================================
-- Cosméticos: Avatares
-- ============================================================
INSERT INTO cosmeticos (id, nome, tipo, url_do_asset, preco_em_moedas)
VALUES
  -- Avatares gratuitos (preço 0)
  ('d0000000-0000-0000-0000-000000000001', 'Avatar Clássico', 'avatar', '/avatars/classico.png', 0),
  ('d0000000-0000-0000-0000-000000000002', 'Avatar Sorriso', 'avatar', '/avatars/sorriso.png', 0),
  ('d0000000-0000-0000-0000-000000000003', 'Avatar Ninja', 'avatar', '/avatars/ninja.png', 0),

  -- Avatares pagos
  ('d0000000-0000-0000-0000-000000000004', 'Avatar Robô', 'avatar', '/avatars/robo.png', 500),
  ('d0000000-0000-0000-0000-000000000005', 'Avatar Fantasma', 'avatar', '/avatars/fantasma.png', 500),
  ('d0000000-0000-0000-0000-000000000006', 'Avatar Dragão', 'avatar', '/avatars/dragao.png', 1000),
  ('d0000000-0000-0000-0000-000000000007', 'Avatar Fênix', 'avatar', '/avatars/fenix.png', 1000),
  ('d0000000-0000-0000-0000-000000000008', 'Avatar Lendário', 'avatar', '/avatars/lendario.png', 2500),

  -- Molduras
  ('d0000000-0000-0000-0000-000000000009', 'Moldura Clássica', 'moldura', '/molduras/classica.png', 0),
  ('d0000000-0000-0000-0000-000000000010', 'Moldura Fogo', 'moldura', '/molduras/fogo.png', 300),
  ('d0000000-0000-0000-0000-000000000011', 'Moldura Gelo', 'moldura', '/molduras/gelo.png', 300),
  ('d0000000-0000-0000-0000-000000000012', 'Moldura Ouro', 'moldura', '/molduras/ouro.png', 800),
  ('d0000000-0000-0000-0000-000000000013', 'Moldura Diamante', 'moldura', '/molduras/diamante.png', 1500),

  -- Efeitos de vitória
  ('d0000000-0000-0000-0000-000000000014', 'Efeito Confetes', 'efeito_de_vitoria', '/efeitos/confetes.png', 200),
  ('d0000000-0000-0000-0000-000000000015', 'Efeito Fogos', 'efeito_de_vitoria', '/efeitos/fogos.png', 500),
  ('d0000000-0000-0000-0000-000000000016', 'Efeito Estrelas', 'efeito_de_vitoria', '/efeitos/estrelas.png', 1000),

  -- Títulos
  ('d0000000-0000-0000-0000-000000000017', 'Título: Novato', 'titulo', NULL, 0),
  ('d0000000-0000-0000-0000-000000000018', 'Título: Estrategista', 'titulo', NULL, 0),
  ('d0000000-0000-0000-0000-000000000019', 'Título: Imparável', 'titulo', NULL, 0),
  ('d0000000-0000-0000-0000-000000000020', 'Título: Mestre dos Números', 'titulo', NULL, 0),
  ('d0000000-0000-0000-0000-000000000021', 'Título: Lenda', 'titulo', NULL, 0),

  -- Cores de destaque
  ('d0000000-0000-0000-0000-000000000022', 'Cor Azul', 'cor_destaque', NULL, 0),
  ('d0000000-0000-0000-0000-000000000023', 'Cor Vermelha', 'cor_destaque', NULL, 0),
  ('d0000000-0000-0000-0000-000000000024', 'Cor Verde', 'cor_destaque', NULL, 0),
  ('d0000000-0000-0000-0000-000000000025', 'Cor Roxa', 'cor_destaque', NULL, 300),
  ('d0000000-0000-0000-0000-000000000026', 'Cor Dourada', 'cor_destaque', NULL, 500);
