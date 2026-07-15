import type { IntervaloDeNumeros } from '../constantes/intervalosDeNumeros'

interface JogadaDaIa {
  numero: number
  paridade: 'par' | 'impar'
}

export function gerarJogadaAleatoria(
  intervalo: IntervaloDeNumeros
): JogadaDaIa {
  const numero = Math.floor(
    Math.random() * (intervalo.maximo - intervalo.minimo + 1)
  ) + intervalo.minimo

  const paridade = numero % 2 === 0 ? 'par' : 'impar'

  return { numero, paridade }
}
