// Tipos gerados manualmente para o schema do Supabase
// Uso: import { Perfil, Partida, Rodada } from '@/supabase/tipos.gen'
//
// Esquema do banco em português (snake_case)
// Service role bypassa RLS nas Server Actions

// ============================================================
// UTILITÁRIOS
// ============================================================

/** Converte snake_case do banco para camelCase no TypeScript */
export type SnakeToCamel<T extends string> =
  T extends `${infer First}_${infer Second}${infer Rest}`
    ? `${First}${Uppercase<Second>}${SnakeToCamel<Rest>}`
    : T;

// ============================================================
// ENUMS (const object + union type)
// ============================================================

export const MODOS_DE_JOGO = {
  CLASSICO: 'classico',
  DIFICIL: 'dificil',
  RELAMPAGO: 'relampago',
  INVISIVEL: 'invisivel',
  CAOS: 'caos',
  SOBREVIVENCIA: 'sobrevivencia',
} as const;

export type ModoDeJogo = (typeof MODOS_DE_JOGO)[keyof typeof MODOS_DE_JOGO];

export const TIPOS_DE_PARTIDA = {
  PARTIDA_RAPIDA: 'partida_rapida',
  SALA_PRIVADA: 'sala_privada',
  CAMPEONATO: 'campeonato',
  PARTIDA_CONTRA_IA: 'partida_contra_ia',
} as const;

export type TipoDePartida = (typeof TIPOS_DE_PARTIDA)[keyof typeof TIPOS_DE_PARTIDA];

export const STATUS_DA_PARTIDA = {
  AGUARDANDO_JOGADORES: 'aguardando_jogadores',
  EM_ANDAMENTO: 'em_andamento',
  FINALIZADA: 'finalizada',
  CANCELADA: 'cancelada',
} as const;

export type StatusDaPartida = (typeof STATUS_DA_PARTIDA)[keyof typeof STATUS_DA_PARTIDA];

export const STATUS_DA_SALA = {
  AGUARDANDO_OPONENTE: 'aguardando_oponente',
  EM_ANDAMENTO: 'em_andamento',
  FINALIZADA: 'finalizada',
  CANCELADA: 'cancelada',
} as const;

export type StatusDaSala = (typeof STATUS_DA_SALA)[keyof typeof STATUS_DA_SALA];

export const STATUS_DO_CAMPEONATO = {
  INSCRICOES_ABERTAS: 'inscricoes_abertas',
  EM_ANDAMENTO: 'em_andamento',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
} as const;

export type StatusDoCampeonato = (typeof STATUS_DO_CAMPEONATO)[keyof typeof STATUS_DO_CAMPEONATO];

export const STATUS_DO_CONVITE = {
  PENDENTE: 'pendente',
  ACEITO: 'aceito',
  RECUSADO: 'recusado',
} as const;

export type StatusDoConvite = (typeof STATUS_DO_CONVITE)[keyof typeof STATUS_DO_CONVITE];

export const PARIDADE = {
  PAR: 'par',
  IMPAR: 'impar',
} as const;

export type Paridade = (typeof PARIDADE)[keyof typeof PARIDADE];

export const FORMATO_DO_CAMPEONATO = {
  MATA_MATA: 'mata_mata',
} as const;

export type FormatoDoCampeonato = (typeof FORMATO_DO_CAMPEONATO)[keyof typeof FORMATO_DO_CAMPEONATO];

export const TIPO_DO_COSMETICO = {
  AVATAR: 'avatar',
  MOLDURA: 'moldura',
  EFEITO_DE_VITORIA: 'efeito_de_vitoria',
  TITULO: 'titulo',
  COR_DESTAQUE: 'cor_destaque',
} as const;

export type TipoDoCosmetico = (typeof TIPO_DO_COSMETICO)[keyof typeof TIPO_DO_COSMETICO];

// ============================================================
// FAIXAS DE ELO (constantes, não é tabela)
// ============================================================

export interface FaixaDeElo {
  nome: string;
  minimo: number;
  maximo: number | null; // null = infinito (Lendário+)
  icone: string;
  cor: string;
}

export const FAIXAS_DE_ELO: FaixaDeElo[] = [
  { nome: 'Bronze', minimo: 0, maximo: 999, icone: 'bronze', cor: '#CD7F32' },
  { nome: 'Prata', minimo: 1000, maximo: 1399, icone: 'prata', cor: '#C0C0C0' },
  { nome: 'Ouro', minimo: 1400, maximo: 1699, icone: 'ouro', cor: '#FFD700' },
  { nome: 'Platina', minimo: 1700, maximo: 1999, icone: 'platina', cor: '#E5E4E2' },
  { nome: 'Diamante', minimo: 2000, maximo: 2299, icone: 'diamante', cor: '#B9F2FF' },
  { nome: 'Mestre', minimo: 2300, maximo: 2699, icone: 'mestre', cor: '#FF00FF' },
  { nome: 'Lendário', minimo: 2700, maximo: null, icone: 'lendario', cor: '#FF4500' },
];

/** Retorna a faixa de elo para um valor numérico */
export function obterFaixaDeElo(elo: number): FaixaDeElo {
  for (let i = FAIXAS_DE_ELO.length - 1; i >= 0; i--) {
    const faixa = FAIXAS_DE_ELO[i];
    if (faixa && elo >= faixa.minimo) return faixa;
  }
  return FAIXAS_DE_ELO[0]!;
}

// ============================================================
// PERFIS
// ============================================================

export interface Perfil {
  id_usuario: string;
  nome: string;
  pais: string | null;
  url_do_avatar: string | null;
  elo: number;
  total_de_vitorias: number;
  total_de_derrotas: number;
  total_de_partidas: number;
  sequencia_atual: number;
  maior_sequencia: number;
  numero_favorito: number | null;
  moedas: number;
  created_at: string;
  updated_at: string;
}

export type PerfilInserir = Omit<Perfil, 'created_at' | 'updated_at' | 'elo' | 'total_de_vitorias' | 'total_de_derrotas' | 'total_de_partidas' | 'sequencia_atual' | 'maior_sequencia'> & {
  elo?: number;
  total_de_vitorias?: number;
  total_de_derrotas?: number;
  total_de_partidas?: number;
  sequencia_atual?: number;
  maior_sequencia?: number;
};

export type PerfilAtualizar = Partial<Omit<Perfil, 'id_usuario' | 'created_at' | 'updated_at'>>;

// ============================================================
// PARTIDAS
// ============================================================

export interface Partida {
  id: string;
  modo: ModoDeJogo;
  tipo: TipoDePartida;
  id_do_primeiro_jogador: string | null;
  id_do_segundo_jogador: string | null;
  id_da_sala: string | null;
  id_do_campeonato: string | null;
  status: StatusDaPartida;
  total_de_rodadas_previsto: 1 | 3 | 5 | 7;
  rodada_atual: number;
  vencedor_id: string | null;
  created_at: string;
  updated_at: string;
}

export type PartidaInserir = Omit<Partida, 'id' | 'created_at' | 'updated_at' | 'rodada_atual' | 'vencedor_id'> & {
  rodada_atual?: number;
  vencedor_id?: string | null;
};

export type PartidaAtualizar = Partial<Omit<Partida, 'id' | 'created_at' | 'updated_at'>>;

// ============================================================
// RODADAS
// ============================================================

export interface Rodada {
  id: string;
  id_da_partida: string;
  numero_da_rodada: number;
  numero_do_primeiro_jogador: number | null;
  paridade_escolhida_pelo_primeiro: Paridade | null;
  token_de_idempotencia_do_primeiro: string | null;
  jogada_do_primeiro_confirmada: boolean;
  numero_do_segundo_jogador: number | null;
  paridade_escolhida_pelo_segundo: Paridade | null;
  token_de_idempotencia_do_segundo: string | null;
  jogada_do_segundo_confirmada: boolean;
  resultado_calculado: boolean;
  vencedor_id: string | null;
  soma_dos_numeros: number | null;
  paridade_resultante: string | null;
}

export type RodadaInserir = Omit<Rodada, 'id'>;

export type RodadaAtualizar = Partial<Omit<Rodada, 'id' | 'id_da_partida' | 'numero_da_rodada'>>;

// ============================================================
// SALAS PRIVADAS
// ============================================================

export interface SalaPrivada {
  id: string;
  codigo: string;
  titulo: string;
  id_do_anfitriao: string;
  total_de_rodadas: 3 | 5 | 7;
  status: StatusDaSala;
  modo_de_jogo: ModoDeJogo;
  created_at: string;
}

export type SalaPrivadaInserir = Omit<SalaPrivada, 'id' | 'created_at' | 'status'> & {
  status?: StatusDaSala;
};

export type SalaPrivadaAtualizar = Partial<Omit<SalaPrivada, 'id' | 'created_at'>>;

// ============================================================
// FILA DE PARTIDA RÁPIDA
// ============================================================

export interface FilaDePartidaRapida {
  id: string;
  id_do_jogador: string;
  created_at: string;
}

export type FilaDePartidaRapidaInserir = Omit<FilaDePartidaRapida, 'id' | 'created_at'>;
export type FilaDePartidaRapidaAtualizar = Partial<Pick<FilaDePartidaRapida, 'created_at'>>;

// ============================================================
// FILA DE SOBREVIVÊNCIA
// ============================================================

export interface FilaDeSobrevivencia {
  id: string;
  id_do_jogador: string;
  vitorias_consecutivas: number;
  created_at: string;
}

// ============================================================
// CAMPEONATOS
// ============================================================

export interface Campeonato {
  id: string;
  nome: string;
  formato: FormatoDoCampeonato;
  total_de_jogadores: 8 | 16 | 32 | 64;
  status: StatusDoCampeonato;
  created_at: string;
}

export type CampeonatoInserir = Omit<Campeonato, 'id' | 'created_at' | 'status'> & {
  status?: StatusDoCampeonato;
};

export type CampeonatoAtualizar = Partial<Omit<Campeonato, 'id' | 'created_at'>>;

// ============================================================
// PARTICIPANTES DO CAMPEONATO
// ============================================================

export interface ParticipanteDoCampeonato {
  id_do_campeonato: string;
  id_do_jogador: string;
  eliminado_em: string | null;
  posicao_final: number | null;
}

export type ParticipanteDoCampeonatoInserir = Omit<ParticipanteDoCampeonato, 'eliminado_em' | 'posicao_final'> & {
  eliminado_em?: string | null;
  posicao_final?: number | null;
};

export type ParticipanteDoCampeonatoAtualizar = Partial<Omit<ParticipanteDoCampeonato, 'id_do_campeonato' | 'id_do_jogador'>>;

// ============================================================
// AMIGOS
// ============================================================

export interface Amigo {
  id_do_jogador: string;
  id_do_amigo: string;
  created_at: string;
}

// ============================================================
// CONVITES DE AMIZADE
// ============================================================

export interface ConviteDeAmizade {
  id: string;
  id_do_remetente: string;
  id_do_destinatario: string;
  status: StatusDoConvite;
  created_at: string;
}

export type ConviteDeAmizadeInserir = Omit<ConviteDeAmizade, 'id' | 'created_at' | 'status'> & {
  status?: StatusDoConvite;
};

export type ConviteDeAmizadeAtualizar = Partial<Omit<ConviteDeAmizade, 'id' | 'id_do_remetente' | 'id_do_destinatario' | 'created_at'>>;

// ============================================================
// TEMPORADAS
// ============================================================

export const STATUS_DA_TEMPORADA = {
  ATIVA: 'ativa',
  FINALIZADA: 'finalizada',
} as const;

export type StatusDaTemporada = (typeof STATUS_DA_TEMPORADA)[keyof typeof STATUS_DA_TEMPORADA];

export interface Temporada {
  id: string;
  nome: string;
  data_de_inicio: string;
  data_de_fim: string;
  elo_inicial: number;
  status: StatusDaTemporada;
  created_at: string;
}

export type TemporadaInserir = Omit<Temporada, 'id' | 'created_at' | 'status'> & {
  status?: StatusDaTemporada;
};

export type TemporadaAtualizar = Partial<Omit<Temporada, 'id' | 'created_at'>>;

// ============================================================
// CONQUISTAS
// ============================================================

export interface Conquista {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  condicao_json: Record<string, unknown>;
  created_at: string;
}

export type ConquistaInserir = Omit<Conquista, 'id' | 'created_at'> & {
  id?: string;
};

export type ConquistaAtualizar = Partial<Omit<Conquista, 'created_at'>>;

// ============================================================
// CONQUISTAS DOS JOGADORES
// ============================================================

export interface ConquistaDoJogador {
  id_do_jogador: string;
  id_da_conquista: string;
  created_at: string;
}

// ============================================================
// COSMÉTICOS
// ============================================================

export interface Cosmetico {
  id: string;
  nome: string;
  tipo: TipoDoCosmetico;
  url_do_asset: string | null;
  preco_em_moedas: number;
  created_at: string;
}

export type CosmeticoInserir = Omit<Cosmetico, 'id' | 'created_at'> & {
  id?: string;
};

export type CosmeticoAtualizar = Partial<Omit<Cosmetico, 'created_at'>>;

// ============================================================
// COSMÉTICOS DOS JOGADORES
// ============================================================

export interface CosmeticoDoJogador {
  id_do_jogador: string;
  id_do_cosmetico: string;
  equipado: boolean;
  created_at: string;
}

export type CosmeticoDoJogadorInserir = Omit<CosmeticoDoJogador, 'created_at'> & {
  created_at?: string;
};

export type CosmeticoDoJogadorAtualizar = Partial<Pick<CosmeticoDoJogador, 'equipado'>>;

// ============================================================
// REPLAYS
// ============================================================

export interface Replay {
  id: string;
  id_da_partida: string;
  dados_json: Record<string, unknown>;
  created_at: string;
}

export type ReplayInserir = Omit<Replay, 'id' | 'created_at'> & {
  id?: string;
};

// ============================================================
// TABELAS UNIFICADAS (para Database type genérico)
// ============================================================

export interface Database {
  public: {
    Tables: {
      perfis: {
        Row: Perfil;
        Insert: PerfilInserir;
        Update: PerfilAtualizar;
      };
      partidas: {
        Row: Partida;
        Insert: PartidaInserir;
        Update: PartidaAtualizar;
      };
      rodadas: {
        Row: Rodada;
        Insert: RodadaInserir;
        Update: RodadaAtualizar;
      };
      salas_privadas: {
        Row: SalaPrivada;
        Insert: SalaPrivadaInserir;
        Update: SalaPrivadaAtualizar;
      };
      fila_de_partida_rapida: {
        Row: FilaDePartidaRapida;
        Insert: Omit<FilaDePartidaRapida, 'id' | 'created_at'>;
        Update: never;
      };
      fila_de_sobrevivencia: {
        Row: FilaDeSobrevivencia;
        Insert: Omit<FilaDeSobrevivencia, 'id' | 'created_at'>;
        Update: Partial<Omit<FilaDeSobrevivencia, 'id' | 'created_at'>>;
      };
      campeonatos: {
        Row: Campeonato;
        Insert: CampeonatoInserir;
        Update: CampeonatoAtualizar;
      };
      participantes_do_campeonato: {
        Row: ParticipanteDoCampeonato;
        Insert: ParticipanteDoCampeonatoInserir;
        Update: ParticipanteDoCampeonatoAtualizar;
      };
      amigos: {
        Row: Amigo;
        Insert: Omit<Amigo, 'created_at'>;
        Update: never;
      };
      convites_de_amizade: {
        Row: ConviteDeAmizade;
        Insert: ConviteDeAmizadeInserir;
        Update: ConviteDeAmizadeAtualizar;
      };
      temporadas: {
        Row: Temporada;
        Insert: TemporadaInserir;
        Update: TemporadaAtualizar;
      };
      conquistas: {
        Row: Conquista;
        Insert: ConquistaInserir;
        Update: ConquistaAtualizar;
      };
      conquistas_dos_jogadores: {
        Row: ConquistaDoJogador;
        Insert: Omit<ConquistaDoJogador, 'created_at'>;
        Update: never;
      };
      cosmeticos: {
        Row: Cosmetico;
        Insert: CosmeticoInserir;
        Update: CosmeticoAtualizar;
      };
      cosmeticos_dos_jogadores: {
        Row: CosmeticoDoJogador;
        Insert: CosmeticoDoJogadorInserir;
        Update: CosmeticoDoJogadorAtualizar;
      };
      replays: {
        Row: Replay;
        Insert: ReplayInserir;
        Update: never;
      };
    };
  };
}
