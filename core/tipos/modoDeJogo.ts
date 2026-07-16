import type { ModoDeJogo } from './partida'

export interface RegraDoModoDeJogo {
  modo: ModoDeJogo
  nomeExibido: string
  descricao: string
  intervalo: { minimo: number; maximo: number }
  tempoLimiteEmSegundos: number
  paridadeVisivelAntesDeJogar: boolean
  permiteEmpate: boolean
  rodadasPorPartida: number
}

export const REGRAS_DOS_MODOS: Record<ModoDeJogo, RegraDoModoDeJogo> = {
  classico: {
    modo: 'classico',
    nomeExibido: 'Clássico',
    descricao: 'Escolha 1 ou 2, par ou ímpar. Simples e direto.',
    intervalo: { minimo: 1, maximo: 2 },
    tempoLimiteEmSegundos: 30,
    paridadeVisivelAntesDeJogar: false,
    permiteEmpate: false,
    rodadasPorPartida: 5,
  },
  dificil: {
    modo: 'dificil',
    nomeExibido: 'Difícil',
    descricao: 'Números de 0 a 10. Mais opções, mais estratégia.',
    intervalo: { minimo: 0, maximo: 10 },
    tempoLimiteEmSegundos: 20,
    paridadeVisivelAntesDeJogar: false,
    permiteEmpate: false,
    rodadasPorPartida: 7,
  },
  relampago: {
    modo: 'relampago',
    nomeExibido: 'Relâmpago',
    descricao: 'Tudo igual ao Clássico, mas você tem só 5 segundos.',
    intervalo: { minimo: 1, maximo: 2 },
    tempoLimiteEmSegundos: 5,
    paridadeVisivelAntesDeJogar: false,
    permiteEmpate: false,
    rodadasPorPartida: 3,
  },
  invisivel: {
    modo: 'invisivel',
    nomeExibido: 'Invisível',
    descricao: 'Você escolhe número e paridade, mas a paridade só é revelada após ambos jogarem.',
    intervalo: { minimo: 1, maximo: 10 },
    tempoLimiteEmSegundos: 30,
    paridadeVisivelAntesDeJogar: true,
    permiteEmpate: true,
    rodadasPorPartida: 5,
  },
  caos: {
    modo: 'caos',
    nomeExibido: 'Caos',
    descricao: 'Intervalo aleatório a cada rodada. Adapte-se ou perca.',
    intervalo: { minimo: 0, maximo: 20 },
    tempoLimiteEmSegundos: 15,
    paridadeVisivelAntesDeJogar: false,
    permiteEmpate: false,
    rodadasPorPartida: 5,
  },
  sobrevivencia: {
    modo: 'sobrevivencia',
    nomeExibido: 'Sobrevivência',
    descricao: 'Jogue até errar. Quem sobreviver mais rodadas vence.',
    intervalo: { minimo: 1, maximo: 5 },
    tempoLimiteEmSegundos: 20,
    paridadeVisivelAntesDeJogar: false,
    permiteEmpate: true,
    rodadasPorPartida: 1,
  },
}

export const TEMPO_LIMITE_POR_MODO_MS: Record<ModoDeJogo, number> = {
  classico: 30_000,
  dificil: 20_000,
  relampago: 5_000,
  invisivel: 30_000,
  caos: 15_000,
  sobrevivencia: 20_000,
}
