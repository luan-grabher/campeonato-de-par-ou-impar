import { describe, it, expect } from 'vitest'
import { calcularResultadoDaRodada } from '../calculo/calcularResultadoDaRodada'

describe('calcularResultadoDaRodada', () => {
  it('retorna par quando ambos jogam 1 (soma 2)', () => {
    const resultado = calcularResultadoDaRodada(1, 1, 'par')

    expect(resultado.somaDosNumeros).toBe(2)
    expect(resultado.paridadeResultante).toBe('par')
    expect(resultado.primeiroJogadorVenceu).toBe(true)
  })

  it('retorna impar quando um joga 1 e outro 2 (soma 3)', () => {
    const resultado = calcularResultadoDaRodada(1, 2, 'impar')

    expect(resultado.somaDosNumeros).toBe(3)
    expect(resultado.paridadeResultante).toBe('impar')
    expect(resultado.primeiroJogadorVenceu).toBe(true)
  })

  it('primeiro jogador perde quando erra a paridade', () => {
    const resultado = calcularResultadoDaRodada(1, 2, 'par')

    expect(resultado.somaDosNumeros).toBe(3)
    expect(resultado.paridadeResultante).toBe('impar')
    expect(resultado.primeiroJogadorVenceu).toBe(false)
  })

  it('funciona com numeros maiores no modo dificil', () => {
    const resultado = calcularResultadoDaRodada(7, 5, 'par')

    expect(resultado.somaDosNumeros).toBe(12)
    expect(resultado.paridadeResultante).toBe('par')
    expect(resultado.primeiroJogadorVenceu).toBe(true)
  })

  it('funciona com zero', () => {
    const resultado = calcularResultadoDaRodada(0, 0, 'par')

    expect(resultado.somaDosNumeros).toBe(0)
    expect(resultado.paridadeResultante).toBe('par')
    expect(resultado.primeiroJogadorVenceu).toBe(true)
  })
})
