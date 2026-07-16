export interface PerfilDoJogador {
  id: string
  nome: string
  email: string | null
  pais: string | null
  urlDoAvatar: string | null
  elo: number
  totalDeVitorias: number
  totalDeDerrotas: number
  totalDePartidas: number
  sequenciaAtual: number
  maiorSequencia: number
  numeroFavorito: number | null
  moedas: number
}

export interface EstatisticasDoJogador {
  taxaDeVitoria: number
  frequenciaDosNumeros: Record<number, number>
  frequenciaDePares: number
  frequenciaDeImpares: number
  tempoMedioPorJogada: number
}
