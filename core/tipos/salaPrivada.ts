export interface ConfiguracaoDaSalaPrivada {
  modoDeJogo: 'classico' | 'dificil' | 'relampago' | 'invisivel' | 'caos' | 'sobrevivencia'
  totalDeRodadas: number
  numeroMaximoDeJogadores: number
  apenasConvidados: boolean
}

export interface DadosDaSalaPrivada {
  id: string
  codigo: string
  nome: string
  idDoAnfitriao: string
  configuracao: ConfiguracaoDaSalaPrivada
  estaAberta: boolean
  criadaEm: Date
}
