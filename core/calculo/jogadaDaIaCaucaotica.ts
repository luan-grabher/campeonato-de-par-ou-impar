import type { IntervaloDeNumeros } from '../constantes/intervalosDeNumeros'
import { gerarJogadaAleatoria } from './jogadaDaIaAleatoria'

interface JogadaDaIa {
  numero: number
  paridade: 'par' | 'impar'
}

let contadorDeRodadasCaotico = 0

export function gerarJogadaCaucaotica(
  intervalo: IntervaloDeNumeros
): JogadaDaIa {
  contadorDeRodadasCaotico++

  if (contadorDeRodadasCaotico <= 3) {
    const numero = Math.floor(
      Math.random() * (intervalo.maximo - intervalo.minimo + 1)
    ) + intervalo.minimo

    const paridade = numero % 2 === 0 ? 'par' : 'impar'
    return { numero, paridade }
  }

  const jogadaInesperada = gerarJogadaAleatoria(intervalo)
  const paridadeInversa = jogadaInesperada.paridade === 'par' ? 'impar' : 'par'

  const numerosComParidadeInversa: number[] = []
  for (let n = intervalo.minimo; n <= intervalo.maximo; n++) {
    const paridadeDoNumero = n % 2 === 0 ? 'par' : 'impar'
    if (paridadeDoNumero === paridadeInversa) {
      numerosComParidadeInversa.push(n)
    }
  }

  const indiceAleatorio = Math.floor(Math.random() * numerosComParidadeInversa.length)
  const numeroEscolhido = numerosComParidadeInversa[indiceAleatorio] ?? jogadaInesperada.numero
  const paridadeEscolhida = numeroEscolhido % 2 === 0 ? 'par' : 'impar'

  return {
    numero: numeroEscolhido,
    paridade: paridadeEscolhida,
  }
}

export function reiniciarJogadaCaucaotica(): void {
  contadorDeRodadasCaotico = 0
}
