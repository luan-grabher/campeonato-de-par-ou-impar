import type { IntervaloDeNumeros } from '../constantes/intervalosDeNumeros'

interface JogadaDaIa {
  numero: number
  paridade: 'par' | 'impar'
}

let ultimoNumeroTeimoso: number | null = null

export function gerarJogadaTeimosa(
  intervalo: IntervaloDeNumeros
): JogadaDaIa {
  if (
    ultimoNumeroTeimoso !== null &&
    ultimoNumeroTeimoso >= intervalo.minimo &&
    ultimoNumeroTeimoso <= intervalo.maximo
  ) {
    const paridade = ultimoNumeroTeimoso % 2 === 0 ? 'par' : 'impar'
    return { numero: ultimoNumeroTeimoso, paridade }
  }

  const numero = Math.floor(
    Math.random() * (intervalo.maximo - intervalo.minimo + 1)
  ) + intervalo.minimo

  ultimoNumeroTeimoso = numero
  const paridade = numero % 2 === 0 ? 'par' : 'impar'

  return { numero, paridade }
}

export function reiniciarJogadaTeimosa(): void {
  ultimoNumeroTeimoso = null
}
