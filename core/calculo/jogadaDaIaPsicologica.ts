import type { IntervaloDeNumeros } from '../constantes/intervalosDeNumeros'

interface JogadaDaIa {
  numero: number
  paridade: 'par' | 'impar'
}

interface HistoricoDeJogadaDoOponente {
  numero: number
  paridade: string
}

export function gerarJogadaPsicologica(
  intervalo: IntervaloDeNumeros,
  historicoDoOponente: HistoricoDeJogadaDoOponente[]
): JogadaDaIa {
  if (historicoDoOponente.length === 0) {
    const numero = Math.floor(
      Math.random() * (intervalo.maximo - intervalo.minimo + 1)
    ) + intervalo.minimo

    const paridade = numero % 2 === 0 ? 'par' : 'impar'
    return { numero, paridade }
  }

  const frequenciaDePares = historicoDoOponente.filter(
    (j) => j.numero % 2 === 0
  ).length
  const total = historicoDoOponente.length
  const oponentePreferePar = frequenciaDePares / total > 0.5

  const paridadeParaVencer = oponentePreferePar ? 'impar' : 'par'

  const numerosQueGeramParidade: number[] = []
  for (let n = intervalo.minimo; n <= intervalo.maximo; n++) {
    const paridadeDoNumero = n % 2 === 0 ? 'par' : 'impar'
    if (paridadeDoNumero === paridadeParaVencer) {
      numerosQueGeramParidade.push(n)
    }
  }

  if (numerosQueGeramParidade.length === 0) {
    const numero = Math.floor(
      Math.random() * (intervalo.maximo - intervalo.minimo + 1)
    ) + intervalo.minimo
    const paridade = numero % 2 === 0 ? 'par' : 'impar'
    return { numero, paridade }
  }

  const indiceAleatorio = Math.floor(Math.random() * numerosQueGeramParidade.length)
  const numeroEscolhido = numerosQueGeramParidade[indiceAleatorio]!
  const paridadeEscolhida = numeroEscolhido % 2 === 0 ? 'par' : 'impar'

  return {
    numero: numeroEscolhido,
    paridade: paridadeEscolhida,
  }
}
