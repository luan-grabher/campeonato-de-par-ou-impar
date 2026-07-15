export interface IntervaloDeNumeros {
  minimo: number
  maximo: number
}

export const INTERVALO_TRADICIONAL: IntervaloDeNumeros = { minimo: 1, maximo: 2 }

export const INTERVALO_EXPANDIDO: IntervaloDeNumeros = { minimo: 0, maximo: 10 }

export function gerarIntervaloAleatorio(): IntervaloDeNumeros {
  const inicio = Math.floor(Math.random() * 6)
  const fim = inicio + Math.floor(Math.random() * 6) + 3
  return { minimo: Math.min(inicio, 0), maximo: Math.min(fim, 20) }
}

/**
 * Gera um intervalo determinístico para o Modo Caos.
 * Usa o ID da rodada como semente para que ambos os jogadores
 * obtenham o mesmo intervalo sem precisar armazená-lo no banco.
 */
export function gerarIntervaloDoCaos(rodadaId: string): IntervaloDeNumeros {
  let hash = 0
  for (let i = 0; i < rodadaId.length; i++) {
    hash = ((hash << 5) - hash) + rodadaId.charCodeAt(i)
    hash |= 0
  }
  const inicio = Math.abs(hash) % 6
  const fim = inicio + (Math.abs(hash >> 8) % 6) + 3
  return { minimo: 0, maximo: Math.min(fim, 20) }
}
