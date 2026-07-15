import { K_FACTOR_PADRAO } from '../constantes/pontuacao'

interface ResultadoDeElo {
  novoEloDoVencedor: number
  novoEloDoPerdedor: number
}

export function calcularElo(
  eloDoVencedor: number,
  eloDoPerdedor: number,
  k: number = K_FACTOR_PADRAO
): ResultadoDeElo {
  const pontuacaoEsperadaVencedor =
    1 / (1 + 10 ** ((eloDoPerdedor - eloDoVencedor) / 400))

  const pontuacaoEsperadaPerdedor =
    1 / (1 + 10 ** ((eloDoVencedor - eloDoPerdedor) / 400))

  const novoEloDoVencedor = Math.round(eloDoVencedor + k * (1 - pontuacaoEsperadaVencedor))
  const novoEloDoPerdedor = Math.round(eloDoPerdedor + k * (0 - pontuacaoEsperadaPerdedor))

  return {
    novoEloDoVencedor: Math.max(0, novoEloDoVencedor),
    novoEloDoPerdedor: Math.max(0, novoEloDoPerdedor),
  }
}
