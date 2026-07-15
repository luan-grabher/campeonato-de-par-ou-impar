export interface JogadaDoReplay {
  numero: number
  paridade: 'par' | 'impar'
}

export interface ResultadoDaRodadaNoReplay {
  soma: number
  paridadeResultante: 'par' | 'impar'
  vencedorId: string
}

export interface RodadaDoReplay {
  numero: number
  jogadaPrimeiro: JogadaDoReplay
  jogadaSegundo: JogadaDoReplay
  resultado: ResultadoDaRodadaNoReplay
}

export interface JogadorDoReplay {
  id: string
  nome: string
  elo: number
  avatar: string | null
}

export interface PartidaDoReplay {
  id: string
  modo: string
  tipo: string
  totalDeRodadas: number
}

export interface DadosDoReplay {
  partida: PartidaDoReplay
  jogadores: [JogadorDoReplay, JogadorDoReplay]
  rodadas: RodadaDoReplay[]
  vencedorId: string
  data: string
}

export interface ReplaySalvo {
  id: string
  idDaPartida: string
  dados: DadosDoReplay
  createdAt: string
}
