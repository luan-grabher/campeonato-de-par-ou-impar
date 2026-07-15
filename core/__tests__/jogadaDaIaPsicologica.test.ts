import { describe, it, expect } from 'vitest'
import { gerarJogadaPsicologica } from '../calculo/jogadaDaIaPsicologica'
import { INTERVALO_TRADICIONAL, INTERVALO_EXPANDIDO } from '../constantes/intervalosDeNumeros'

describe('gerarJogadaPsicologica', () => {
  it('retorna jogada aleatoria quando nao ha historico', () => {
    const jogada = gerarJogadaPsicologica(INTERVALO_TRADICIONAL, [])

    expect(jogada.numero).toBeGreaterThanOrEqual(INTERVALO_TRADICIONAL.minimo)
    expect(jogada.numero).toBeLessThanOrEqual(INTERVALO_TRADICIONAL.maximo)
  })

  it('escolhe paridade contra a preferencia do oponente', () => {
    // Oponente sempre escolhe 2 (par)
    const historico = [
      { numero: 2, paridade: 'par' },
      { numero: 2, paridade: 'par' },
      { numero: 2, paridade: 'par' },
      { numero: 2, paridade: 'par' },
    ]

    const jogada = gerarJogadaPsicologica(INTERVALO_TRADICIONAL, historico)

    // IA deve escolher impar (1) para vencer
    expect(jogada.paridade).toBe('impar')
    expect(jogada.numero).toBe(1)
  })

  it('funciona com intervalo expandido', () => {
    const historico = [
      { numero: 8, paridade: 'par' },
      { numero: 6, paridade: 'par' },
    ]

    const jogada = gerarJogadaPsicologica(INTERVALO_EXPANDIDO, historico)

    expect(jogada.numero).toBeGreaterThanOrEqual(INTERVALO_EXPANDIDO.minimo)
    expect(jogada.numero).toBeLessThanOrEqual(INTERVALO_EXPANDIDO.maximo)
    expect(jogada.paridade).toBe('impar')
  })

  it('quando oponente prefere impar, IA escolhe par', () => {
    const historico = [
      { numero: 1, paridade: 'impar' },
      { numero: 1, paridade: 'impar' },
      { numero: 1, paridade: 'impar' },
    ]

    const jogada = gerarJogadaPsicologica(INTERVALO_TRADICIONAL, historico)

    expect(jogada.paridade).toBe('par')
    expect(jogada.numero).toBe(2)
  })
})
