import { describe, it, expect } from 'vitest'
import { validarJogada } from '../validacao/validarJogada'
import { INTERVALO_TRADICIONAL, INTERVALO_EXPANDIDO } from '../constantes/intervalosDeNumeros'

describe('validarJogada', () => {
  it('aceita numero valido no modo classico', () => {
    const resultado = validarJogada({
      numeroEscolhido: 1,
      intervalo: INTERVALO_TRADICIONAL,
      modo: 'classico',
    })

    expect(resultado.valida).toBe(true)
    expect(resultado.erro).toBeUndefined()
  })

  it('rejeita numero fora do intervalo', () => {
    const resultado = validarJogada({
      numeroEscolhido: 5,
      intervalo: INTERVALO_TRADICIONAL,
      modo: 'classico',
    })

    expect(resultado.valida).toBe(false)
    expect(resultado.erro).toBeDefined()
  })

  it('rejeita numero nao inteiro', () => {
    const resultado = validarJogada({
      numeroEscolhido: 1.5,
      intervalo: INTERVALO_TRADICIONAL,
      modo: 'classico',
    })

    expect(resultado.valida).toBe(false)
    expect(resultado.erro).toContain('inteiro')
  })

  it('aceita numeros expandidos no modo dificil', () => {
    const resultado = validarJogada({
      numeroEscolhido: 7,
      intervalo: INTERVALO_EXPANDIDO,
      modo: 'dificil',
    })

    expect(resultado.valida).toBe(true)
  })

  it('rejeita numero 3 no modo classico', () => {
    const resultado = validarJogada({
      numeroEscolhido: 3,
      intervalo: INTERVALO_EXPANDIDO,
      modo: 'classico',
    })

    expect(resultado.valida).toBe(false)
  })

  it('rejeita numero 0 no modo classico', () => {
    const resultado = validarJogada({
      numeroEscolhido: 0,
      intervalo: INTERVALO_TRADICIONAL,
      modo: 'classico',
    })

    expect(resultado.valida).toBe(false)
  })

  it('rejeita numero 0 no modo relampago', () => {
    const resultado = validarJogada({
      numeroEscolhido: 0,
      intervalo: { minimo: 0, maximo: 2 },
      modo: 'relampago',
    })

    expect(resultado.valida).toBe(false)
  })
})
