import type { ModoDeJogo } from '../tipos/partida'

export const K_FACTOR_PADRAO = 32
export const K_FACTOR_INICIANTE = 64
export const ELO_INICIAL = 1000

export const MOEDAS_POR_VITORIA: Record<ModoDeJogo, number> = {
  classico: 50,
  dificil: 80,
  relampago: 100,
  invisivel: 70,
  caos: 120,
  sobrevivencia: 90,
}

export const MOEDAS_POR_DERROTA: Record<ModoDeJogo, number> = {
  classico: 10,
  dificil: 15,
  relampago: 20,
  invisivel: 12,
  caos: 25,
  sobrevivencia: 18,
}

export const SEQUENCIA_BONUS_POR_VITORIA_CONSECUTIVA = 3
export const BONUS_POR_SEQUENCIA = 1.5

export const NIVEL_MINIMO_PARA_MUDAR_DE_FAIXA = 5
