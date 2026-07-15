import { describe, it, expect } from 'vitest'
import { gerarJogadaAleatoria } from '../calculo/jogadaDaIaAleatoria'
import { INTERVALO_TRADICIONAL, INTERVALO_EXPANDIDO } from '../constantes/intervalosDeNumeros'

describe('gerarJogadaAleatoria', () => {
  it('retorna numero dentro do intervalo tradicional', () => {
    for (let i = 0; i < 100; i++) {
      const jogada = gerarJogadaAleatoria(INTERVALO_TRADICIONAL)

      expect(jogada.numero).toBeGreaterThanOrEqual(INTERVALO_TRADICIONAL.minimo)
      expect(jogada.numero).toBeLessThanOrEqual(INTERVALO_TRADICIONAL.maximo)
    }
  })

  it('retorna numero dentro do intervalo expandido', () => {
    for (let i = 0; i < 100; i++) {
      const jogada = gerarJogadaAleatoria(INTERVALO_EXPANDIDO)

      expect(jogada.numero).toBeGreaterThanOrEqual(INTERVALO_EXPANDIDO.minimo)
      expect(jogada.numero).toBeLessThanOrEqual(INTERVALO_EXPANDIDO.maximo)
    }
  })

  it('paridade corresponde ao numero gerado', () => {
    for (let i = 0; i < 100; i++) {
      const jogada = gerarJogadaAleatoria(INTERVALO_TRADICIONAL)

      const paridadeEsperada = jogada.numero % 2 === 0 ? 'par' : 'impar'
      expect(jogada.paridade).toBe(paridadeEsperada)
    }
  })

  it('produz ambos os numeros 1 e 2 eventualmente', () => {
    const numerosVistos = new Set<number>()

    for (let i = 0; i < 200; i++) {
      const jogada = gerarJogadaAleatoria(INTERVALO_TRADICIONAL)
      numerosVistos.add(jogada.numero)
    }

    expect(numerosVistos.has(1)).toBe(true)
    expect(numerosVistos.has(2)).toBe(true)
  })
})
