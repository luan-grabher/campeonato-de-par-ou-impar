import { describe, it, expect } from 'vitest'
import { calcularElo } from '../calculo/calcularElo'

describe('calcularElo', () => {
  it('jogadores com mesmo elo resultam em ganho de 16 para o vencedor e perda de 16 para o perdedor', () => {
    const resultado = calcularElo(1000, 1000, 32)

    expect(resultado.novoEloDoVencedor).toBe(1016)
    expect(resultado.novoEloDoPerdedor).toBe(984)
  })

  it('vencedor com elo maior ganha menos pontos', () => {
    const resultado = calcularElo(1500, 1000, 32)

    expect(resultado.novoEloDoVencedor).toBeGreaterThan(1500)
    expect(resultado.novoEloDoVencedor).toBeLessThan(1510)
    expect(resultado.novoEloDoPerdedor).toBeLessThan(1000)
  })

  it('vencedor com elo menor (azarão) ganha mais pontos', () => {
    const resultado = calcularElo(1000, 1500, 32)

    expect(resultado.novoEloDoVencedor).toBe(1030)
    expect(resultado.novoEloDoPerdedor).toBe(1470)
  })

  it('usa K=32 como padrao', () => {
    const resultado = calcularElo(1000, 1000)

    expect(resultado.novoEloDoVencedor).toBe(1016)
    expect(resultado.novoEloDoPerdedor).toBe(984)
  })

  it('K=64 dobra a movimentacao', () => {
    const resultado = calcularElo(1000, 1000, 64)

    expect(resultado.novoEloDoVencedor).toBe(1032)
    expect(resultado.novoEloDoPerdedor).toBe(968)
  })

  it('elo nunca fica negativo', () => {
    const resultado = calcularElo(100, 0, 64)

    expect(resultado.novoEloDoVencedor).toBeGreaterThanOrEqual(0)
    expect(resultado.novoEloDoPerdedor).toBeGreaterThanOrEqual(0)
  })
})
