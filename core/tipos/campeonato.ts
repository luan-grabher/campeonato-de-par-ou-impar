export interface ConfiguracaoDoCampeonato {
  nome: string
  modoDeJogo: 'classico' | 'dificil' | 'relampago' | 'invisivel' | 'caos' | 'sobrevivencia'
  numeroMaximoDeParticipantes: number
  tipoDeChaveamento: 'mata_mata' | 'todos_contra_todos' | 'grupos_e_mata_mata'
}

export interface ParticipanteDoCampeonato {
  id: string
  idDoCampeonato: string
  idDoJogador: string
  pontuacao: number
  posicaoAtual: number | null
  estaEliminado: boolean
}

export interface DadosDoCampeonato {
  id: string
  configuracao: ConfiguracaoDoCampeonato
  idDoCriador: string
  estaAberto: boolean
  iniciadoEm: Date | null
  finalizadoEm: Date | null
  idDoCampeao: string | null
}
