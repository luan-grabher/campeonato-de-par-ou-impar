import type { ResultadoDaRodada } from '../tipos/rodada'

export function calcularResultadoDaRodada(
  numeroDoPrimeiroJogador: number,
  numeroDoSegundoJogador: number,
  paridadeEscolhidaPeloPrimeiro: 'par' | 'impar'
): ResultadoDaRodada {
  const somaDosNumeros = numeroDoPrimeiroJogador + numeroDoSegundoJogador
  const paridadeResultante = somaDosNumeros % 2 === 0 ? 'par' : 'impar'
  const primeiroJogadorVenceu = paridadeResultante === paridadeEscolhidaPeloPrimeiro

  return {
    somaDosNumeros,
    paridadeResultante,
    primeiroJogadorVenceu,
  }
}
