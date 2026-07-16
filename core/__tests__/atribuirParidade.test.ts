import { describe, it, expect } from 'vitest'
import {
  atribuirParidadeDaRodada,
  sortearParidadeInicial,
} from '../calculo/atribuirParidade'
import type { Paridade } from '../calculo/atribuirParidade'

describe('atribuirParidadeDaRodada', () => {
  it('R1 com paridade inicial par mantem primeiro=par segundo=impar', () => {
    const resultado = atribuirParidadeDaRodada(1, 'par', 5)

    expect(resultado).not.toHaveProperty('desempate')
    if (!('desempate' in resultado)) {
      expect(resultado.paridadeDoPrimeiro).toBe('par')
      expect(resultado.paridadeDoSegundo).toBe('impar')
    }
  })

  it('R2 com paridade inicial par inverte para primeiro=impar segundo=par', () => {
    const resultado = atribuirParidadeDaRodada(2, 'par', 5)

    expect(resultado).not.toHaveProperty('desempate')
    if (!('desempate' in resultado)) {
      expect(resultado.paridadeDoPrimeiro).toBe('impar')
      expect(resultado.paridadeDoSegundo).toBe('par')
    }
  })

  it('R3 de Bo3 retorna desempate', () => {
    const resultado = atribuirParidadeDaRodada(3, 'par', 3)

    expect(resultado).toEqual({ desempate: true })
  })

  it('R5 de Bo5 retorna desempate', () => {
    const resultado = atribuirParidadeDaRodada(5, 'par', 5)

    expect(resultado).toEqual({ desempate: true })
  })

  it('R1 com paridade inicial impar mantem primeiro=impar segundo=par', () => {
    const resultado = atribuirParidadeDaRodada(1, 'impar', 5)

    expect(resultado).not.toHaveProperty('desempate')
    if (!('desempate' in resultado)) {
      expect(resultado.paridadeDoPrimeiro).toBe('impar')
      expect(resultado.paridadeDoSegundo).toBe('par')
    }
  })

  it('R2 com paridade inicial impar inverte para primeiro=par segundo=impar', () => {
    const resultado = atribuirParidadeDaRodada(2, 'impar', 5)

    expect(resultado).not.toHaveProperty('desempate')
    if (!('desempate' in resultado)) {
      expect(resultado.paridadeDoPrimeiro).toBe('par')
      expect(resultado.paridadeDoSegundo).toBe('impar')
    }
  })

  it('rodadas comuns de Bo5 (R1, R2, R3, R4) nao retornam desempate', () => {
    for (let rodada = 1; rodada <= 4; rodada++) {
      const resultado = atribuirParidadeDaRodada(rodada, 'par', 5)

      expect(resultado).not.toHaveProperty('desempate')
    }
  })

  it('rodadas de Bo3 (R1, R2) nao retornam desempate', () => {
    const resultado1 = atribuirParidadeDaRodada(1, 'par', 3)
    const resultado2 = atribuirParidadeDaRodada(2, 'par', 3)

    expect(resultado1).not.toHaveProperty('desempate')
    expect(resultado2).not.toHaveProperty('desempate')
  })
})

describe('sortearParidadeInicial', () => {
  it('retorna par ou impar em varios sorteios', () => {
    const resultados = new Set<Paridade>()

    for (let i = 0; i < 100; i++) {
      resultados.add(sortearParidadeInicial())
    }

    expect(resultados.has('par')).toBe(true)
    expect(resultados.has('impar')).toBe(true)
  })
})
