-- Migration: 001_schema_inicial
-- Descrição: Criação do schema completo do Campeonato de Par ou Ímpar
-- Todas as tabelas, índices, constraints e trigger de criação automática de perfil

-- ============================================================
-- Extensão UUID
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Perfis (estende auth.users)
-- ============================================================
CREATE TABLE perfis (
  id_usuario UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(24) NOT NULL CHECK (char_length(nome) >= 2),
  pais VARCHAR(2),
  url_do_avatar TEXT,
  elo INTEGER NOT NULL DEFAULT 1200,
  total_de_vitorias INTEGER NOT NULL DEFAULT 0,
  total_de_derrotas INTEGER NOT NULL DEFAULT 0,
  total_de_partidas INTEGER NOT NULL DEFAULT 0,
  sequencia_atual INTEGER NOT NULL DEFAULT 0,
  maior_sequencia INTEGER NOT NULL DEFAULT 0,
  numero_favorito INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Salas privadas
-- ============================================================
CREATE TABLE salas_privadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(6) NOT NULL UNIQUE,
  titulo VARCHAR(50) NOT NULL,
  id_do_anfitriao UUID NOT NULL REFERENCES perfis(id_usuario),
  total_de_rodadas INTEGER NOT NULL CHECK (total_de_rodadas IN (3, 5, 7)),
  status TEXT NOT NULL DEFAULT 'aguardando_oponente' CHECK (status IN ('aguardando_oponente', 'em_andamento', 'finalizada', 'cancelada')),
  modo_de_jogo TEXT NOT NULL DEFAULT 'classico',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Campeonatos
-- ============================================================
CREATE TABLE campeonatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  formato TEXT NOT NULL CHECK (formato IN ('mata_mata')),
  total_de_jogadores INTEGER NOT NULL CHECK (total_de_jogadores IN (8, 16, 32, 64)),
  status TEXT NOT NULL DEFAULT 'inscricoes_abertas' CHECK (status IN ('inscricoes_abertas', 'em_andamento', 'finalizado', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Partidas
-- ============================================================
CREATE TABLE partidas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modo TEXT NOT NULL CHECK (modo IN ('classico', 'dificil', 'relampago', 'invisivel', 'caos', 'sobrevivencia')),
  tipo TEXT NOT NULL CHECK (tipo IN ('partida_rapida', 'sala_privada', 'campeonato', 'partida_contra_ia')),
  id_do_primeiro_jogador UUID REFERENCES perfis(id_usuario),
  id_do_segundo_jogador UUID REFERENCES perfis(id_usuario),
  id_da_sala UUID REFERENCES salas_privadas(id),
  id_do_campeonato UUID REFERENCES campeonatos(id),
  status TEXT NOT NULL DEFAULT 'aguardando_jogadores' CHECK (status IN ('aguardando_jogadores', 'em_andamento', 'finalizada', 'cancelada')),
  total_de_rodadas_previsto INTEGER NOT NULL CHECK (total_de_rodadas_previsto IN (1, 3, 5, 7)),
  rodada_atual INTEGER NOT NULL DEFAULT 0,
  vencedor_id UUID REFERENCES perfis(id_usuario),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Rodadas
-- ============================================================
CREATE TABLE rodadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_da_partida UUID NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
  numero_da_rodada INTEGER NOT NULL CHECK (numero_da_rodada > 0),
  numero_do_primeiro_jogador INTEGER,
  paridade_escolhida_pelo_primeiro TEXT CHECK (paridade_escolhida_pelo_primeiro IN ('par', 'impar')),
  token_de_idempotencia_do_primeiro UUID UNIQUE,
  jogada_do_primeiro_confirmada BOOLEAN NOT NULL DEFAULT FALSE,
  numero_do_segundo_jogador INTEGER,
  paridade_escolhida_pelo_segundo TEXT CHECK (paridade_escolhida_pelo_segundo IN ('par', 'impar')),
  token_de_idempotencia_do_segundo UUID UNIQUE,
  jogada_do_segundo_confirmada BOOLEAN NOT NULL DEFAULT FALSE,
  resultado_calculado BOOLEAN NOT NULL DEFAULT FALSE,
  vencedor_id UUID REFERENCES perfis(id_usuario),
  soma_dos_numeros INTEGER,
  paridade_resultante TEXT,
  UNIQUE(id_da_partida, numero_da_rodada)
);

-- ============================================================
-- Fila de partida rápida
-- ============================================================
CREATE TABLE fila_de_partida_rapida (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_do_jogador UUID NOT NULL REFERENCES perfis(id_usuario) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Participantes do campeonato
-- ============================================================
CREATE TABLE participantes_do_campeonato (
  id_do_campeonato UUID NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
  id_do_jogador UUID NOT NULL REFERENCES perfis(id_usuario) ON DELETE CASCADE,
  eliminado_em UUID REFERENCES partidas(id),
  posicao_final INTEGER,
  PRIMARY KEY (id_do_campeonato, id_do_jogador)
);

-- ============================================================
-- Amigos
-- ============================================================
CREATE TABLE amigos (
  id_do_jogador UUID NOT NULL REFERENCES perfis(id_usuario) ON DELETE CASCADE,
  id_do_amigo UUID NOT NULL REFERENCES perfis(id_usuario) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_do_jogador, id_do_amigo),
  CHECK (id_do_jogador <> id_do_amigo)
);

-- ============================================================
-- Convites de amizade
-- ============================================================
CREATE TABLE convites_de_amizade (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_do_remetente UUID NOT NULL REFERENCES perfis(id_usuario) ON DELETE CASCADE,
  id_do_destinatario UUID NOT NULL REFERENCES perfis(id_usuario) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'recusado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id_do_remetente, id_do_destinatario)
);

-- ============================================================
-- Temporadas
-- ============================================================
CREATE TABLE temporadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(50) NOT NULL,
  data_de_inicio TIMESTAMPTZ NOT NULL,
  data_de_fim TIMESTAMPTZ NOT NULL,
  elo_inicial INTEGER NOT NULL DEFAULT 1200,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Conquistas
-- ============================================================
CREATE TABLE conquistas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(60) NOT NULL,
  descricao TEXT NOT NULL,
  icone TEXT NOT NULL,
  condicao_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Conquistas dos jogadores
-- ============================================================
CREATE TABLE conquistas_dos_jogadores (
  id_do_jogador UUID NOT NULL REFERENCES perfis(id_usuario) ON DELETE CASCADE,
  id_da_conquista UUID NOT NULL REFERENCES conquistas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_do_jogador, id_da_conquista)
);

-- ============================================================
-- Cosméticos
-- ============================================================
CREATE TABLE cosmeticos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(50) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('avatar', 'moldura', 'efeito_de_vitoria', 'titulo', 'cor_destaque')),
  url_do_asset TEXT,
  preco_em_moedas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Cosméticos dos jogadores
-- ============================================================
CREATE TABLE cosmeticos_dos_jogadores (
  id_do_jogador UUID NOT NULL REFERENCES perfis(id_usuario) ON DELETE CASCADE,
  id_do_cosmetico UUID NOT NULL REFERENCES cosmeticos(id) ON DELETE CASCADE,
  equipado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_do_jogador, id_do_cosmetico)
);

-- ============================================================
-- Replays
-- ============================================================
CREATE TABLE replays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_da_partida UUID NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
  dados_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Índices
-- ============================================================
CREATE INDEX idx_partidas_primeiro_jogador ON partidas(id_do_primeiro_jogador);
CREATE INDEX idx_partidas_segundo_jogador ON partidas(id_do_segundo_jogador);
CREATE INDEX idx_partidas_status ON partidas(status);
CREATE INDEX idx_rodadas_partida ON rodadas(id_da_partida, numero_da_rodada);
CREATE INDEX idx_perfis_elo ON perfis(elo DESC);

-- ============================================================
-- Trigger: criar perfil automático no signup
-- ============================================================
CREATE OR REPLACE FUNCTION criar_perfil_ao_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfis (id_usuario, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Jogador'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION criar_perfil_ao_signup();
