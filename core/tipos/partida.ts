export type ModoDeJogo =
  | 'classico'
  | 'dificil'
  | 'relampago'
  | 'invisivel'
  | 'caos'
  | 'sobrevivencia'

export type TipoDePartida =
  | 'partida_rapida'
  | 'sala_privada'
  | 'campeonato'
  | 'partida_contra_ia'

export type StatusDaPartida =
  | 'aguardando_jogadores'
  | 'em_andamento'
  | 'finalizada'
  | 'cancelada'

export interface DadosDaPartida {
  id: string
  modo: ModoDeJogo
  tipo: TipoDePartida
  idDoPrimeiroJogador: string | null
  idDoSegundoJogador: string | null
  idDaSala: string | null
  idDoCampeonato: string | null
  status: StatusDaPartida
  totalDeRodadasPrevisto: number
  rodadaAtual: number
  vencedorId: string | null
}
