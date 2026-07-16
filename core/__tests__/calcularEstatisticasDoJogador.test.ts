import { describe, it, expect } from 'vitest'
import {
  calcularFrequenciaDosNumeros,
  calcularEstatisticasDoJogador,
} from '../calculo/calcularEstatisticasDoJogador'
import type { PerfilDoJogador } from '../tipos/jogador'

describe('calcularFrequenciaDosNumeros', () => {
  it('retorna objeto vazio para historico vazio', () => {
    const resultado = calcularFrequenciaDosNumeros([])

    expect(resultado).toEqual({})
  })

  it('conta frequencia de cada numero', () => {
    const historico = [
      { numero: 1, paridade: 'impar' },
      { numero: 2, paridade: 'par' },
      { numero: 1, paridade: 'impar' },
      { numero: 3, paridade: 'impar' },
      { numero: 1, paridade: 'impar' },
    ]

    const resultado = calcularFrequenciaDosNumeros(historico)

    expect(resultado[1]).toBe(3)
    expect(resultado[2]).toBe(1)
    expect(resultado[3]).toBe(1)
  })
})

describe('calcularEstatisticasDoJogador', () => {
  const perfilBase: PerfilDoJogador = {
    id: '123',
    nome: 'Teste',
    email: null,
    pais: null,
    urlDoAvatar: null,
    elo: 1000,
    totalDeVitorias: 7,
    totalDeDerrotas: 3,
    totalDePartidas: 10,
    sequenciaAtual: 2,
    maiorSequencia: 5,
    numeroFavorito: null,
    moedas: 0,
  }

  it('calcula taxaDeVitoria corretamente', () => {
    const estatisticas = calcularEstatisticasDoJogador(perfilBase, [])

    expect(estatisticas.taxaDeVitoria).toBe(0.7)
  })

  it('retorna taxa 0 quando nao ha partidas', () => {
    const perfilSemPartidas: PerfilDoJogador = {
      ...perfilBase,
      totalDeVitorias: 0,
      totalDeDerrotas: 0,
      totalDePartidas: 0,
    }

    const estatisticas = calcularEstatisticasDoJogador(perfilSemPartidas, [])

    expect(estatisticas.taxaDeVitoria).toBe(0)
  })

  it('calcula frequencia de pares e impares', () => {
    const historico = [
      { numero: 1, paridade: 'impar' },
      { numero: 2, paridade: 'par' },
      { numero: 1, paridade: 'impar' },
      { numero: 4, paridade: 'par' },
      { numero: 1, paridade: 'impar' },
    ]

    const estatisticas = calcularEstatisticasDoJogador(perfilBase, historico)

    expect(estatisticas.frequenciaDePares).toBe(0.4)
    expect(estatisticas.frequenciaDeImpares).toBe(0.6)
  })

  it('retorna frequencia zero quando nao ha historico', () => {
    const estatisticas = calcularEstatisticasDoJogador(perfilBase, [])

    expect(estatisticas.frequenciaDePares).toBe(0)
    expect(estatisticas.frequenciaDeImpares).toBe(0)
    expect(estatisticas.frequenciaDosNumeros).toEqual({})
  })
})
