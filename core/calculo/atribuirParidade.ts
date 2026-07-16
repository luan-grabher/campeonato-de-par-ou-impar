export type Paridade = 'par' | 'impar'

export interface AtribuicaoDeParidade {
  paridadeDoPrimeiro: Paridade
  paridadeDoSegundo: Paridade
}

function inverterParidade(paridade: Paridade): Paridade {
  return paridade === 'par' ? 'impar' : 'par'
}

export function atribuirParidadeDaRodada(
  numeroDaRodada: number,
  paridadeInicialDoPrimeiro: Paridade,
  totalDeRodadas: number
): AtribuicaoDeParidade | { desempate: true } {
  if (numeroDaRodada === totalDeRodadas && totalDeRodadas % 2 !== 0) {
    return { desempate: true }
  }

  const paridadeDoPrimeiro =
    numeroDaRodada % 2 === 0
      ? inverterParidade(paridadeInicialDoPrimeiro)
      : paridadeInicialDoPrimeiro

  const paridadeDoSegundo = inverterParidade(paridadeDoPrimeiro)

  return { paridadeDoPrimeiro, paridadeDoSegundo }
}

export function sortearParidadeInicial(): Paridade {
  return Math.random() < 0.5 ? 'par' : 'impar'
}
