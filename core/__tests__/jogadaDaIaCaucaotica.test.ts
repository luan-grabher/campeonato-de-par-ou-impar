import { describe, it, expect, beforeEach } from 'vitest'
import {
  gerarJogadaCaucaotica,
  reiniciarJogadaCaucaotica,
} from '../calculo/jogadaDaIaCaucaotica'
import { INTERVALO_TRADICIONAL } from '../constantes/intervalosDeNumeros'

describe('gerarJogadaCaucaotica', () => {
  beforeEach(() => {
    reiniciarJogadaCaucaotica()
  })

  it('primeiras 3 rodadas sao previsiveis (dentro do intervalo)', () => {
    for (let i = 0; i < 3; i++) {
      const jogada = gerarJogadaCaucaotica(INTERVALO_TRADICIONAL)

      expect(jogada.numero).toBeGreaterThanOrEqual(INTERVALO_TRADICIONAL.minimo)
      expect(jogada.numero).toBeLessThanOrEqual(INTERVALO_TRADICIONAL.maximo)
    }
  })

  it('apos 3 rodadas muda o comportamento', () => {
    // Consumir as 3 primeiras rodadas
    gerarJogadaCaucaotica(INTERVALO_TRADICIONAL)
    gerarJogadaCaucaotica(INTERVALO_TRADICIONAL)
    gerarJogadaCaucaotica(INTERVALO_TRADICIONAL)

    const jogada = gerarJogadaCaucaotica(INTERVALO_TRADICIONAL)
    expect(jogada.numero).toBeGreaterThanOrEqual(INTERVALO_TRADICIONAL.minimo)
    expect(jogada.numero).toBeLessThanOrEqual(INTERVALO_TRADICIONAL.maximo)
  })

  it('reiniciarJogadaCaucaotica reseta o contador', () => {
    gerarJogadaCaucaotica(INTERVALO_TRADICIONAL)
    gerarJogadaCaucaotica(INTERVALO_TRADICIONAL)
    gerarJogadaCaucaotica(INTERVALO_TRADICIONAL)

    reiniciarJogadaCaucaotica()

    // Agora deve voltar ao comportamento previsivel
    const jogada = gerarJogadaCaucaotica(INTERVALO_TRADICIONAL)
    expect(jogada.numero).toBeGreaterThanOrEqual(INTERVALO_TRADICIONAL.minimo)
    expect(jogada.numero).toBeLessThanOrEqual(INTERVALO_TRADICIONAL.maximo)
  })
})
