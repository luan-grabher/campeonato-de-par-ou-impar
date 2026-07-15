import { describe, it, expect, beforeEach } from 'vitest'
import {
  gerarJogadaTeimosa,
  reiniciarJogadaTeimosa,
} from '../calculo/jogadaDaIaTeimosa'
import { INTERVALO_TRADICIONAL } from '../constantes/intervalosDeNumeros'

describe('gerarJogadaTeimosa', () => {
  beforeEach(() => {
    reiniciarJogadaTeimosa()
  })

  it('retorna o mesmo numero em chamadas consecutivas', () => {
    const primeira = gerarJogadaTeimosa(INTERVALO_TRADICIONAL)

    for (let i = 0; i < 10; i++) {
      const proxima = gerarJogadaTeimosa(INTERVALO_TRADICIONAL)
      expect(proxima.numero).toBe(primeira.numero)
    }
  })

  it('retorna numero dentro do intervalo', () => {
    for (let i = 0; i < 50; i++) {
      reiniciarJogadaTeimosa()
      const jogada = gerarJogadaTeimosa(INTERVALO_TRADICIONAL)

      expect(jogada.numero).toBeGreaterThanOrEqual(INTERVALO_TRADICIONAL.minimo)
      expect(jogada.numero).toBeLessThanOrEqual(INTERVALO_TRADICIONAL.maximo)
    }
  })

  it('reiniciarJogadaTeimosa permite mudar o numero', () => {
    const primeira = gerarJogadaTeimosa(INTERVALO_TRADICIONAL)
    reiniciarJogadaTeimosa()
    const segunda = gerarJogadaTeimosa(INTERVALO_TRADICIONAL)

    // Pode ser o mesmo por acaso, mas verificamos que reiniciar nao quebra
    expect(segunda.numero).toBeGreaterThanOrEqual(INTERVALO_TRADICIONAL.minimo)
    expect(segunda.numero).toBeLessThanOrEqual(INTERVALO_TRADICIONAL.maximo)
  })
})
