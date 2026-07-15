interface ResultadoDoModoInvisivel {
  paridadeSorteada: 'par' | 'impar'
  primeiroJogadorVenceu: boolean
}

export function calcularResultadoDoModoInvisivel(
  numeroDoPrimeiroJogador: number,
  numeroDoSegundoJogador: number
): ResultadoDoModoInvisivel {
  const paridadeSorteada = Math.random() < 0.5 ? 'par' : 'impar'
  const somaDosNumeros = numeroDoPrimeiroJogador + numeroDoSegundoJogador
  const paridadeReal = somaDosNumeros % 2 === 0 ? 'par' : 'impar'
  const primeiroJogadorVenceu = paridadeSorteada === paridadeReal

  return {
    paridadeSorteada,
    primeiroJogadorVenceu,
  }
}
