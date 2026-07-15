'use server'

import { criarPartida } from '../partidaContraIaStore'
import { randomUUID } from 'crypto'

export interface IniciarPartidaResultado {
  idDaPartida: string
  totalDeRodadas: number
}

export async function iniciarPartidaContraIa(
  nomeDoJogador: string
): Promise<IniciarPartidaResultado> {
  if (!nomeDoJogador || nomeDoJogador.trim().length === 0) {
    throw new Error('Nome do jogador é obrigatório.')
  }

  const nomeNormalizado = nomeDoJogador.trim()

  if (nomeNormalizado.length > 20) {
    throw new Error('Nome muito longo. Use no máximo 20 caracteres.')
  }

  const id = randomUUID()
  const totalDeRodadas = 3

  criarPartida(id, nomeNormalizado, totalDeRodadas)

  return {
    idDaPartida: id,
    totalDeRodadas,
  }
}
