export interface FaixaDeElo {
  nome: string
  eloMinimo: number
  eloMaximo: number
  icone: string
}

export const FAIXAS_DE_ELO: FaixaDeElo[] = [
  { nome: 'Bronze', eloMinimo: 0, eloMaximo: 999, icone: '🥉' },
  { nome: 'Prata', eloMinimo: 1000, eloMaximo: 1399, icone: '🥈' },
  { nome: 'Ouro', eloMinimo: 1400, eloMaximo: 1699, icone: '🥇' },
  { nome: 'Platina', eloMinimo: 1700, eloMaximo: 1999, icone: '💎' },
  { nome: 'Diamante', eloMinimo: 2000, eloMaximo: 2299, icone: '🌟' },
  { nome: 'Mestre', eloMinimo: 2300, eloMaximo: 2699, icone: '👑' },
  { nome: 'Lendário', eloMinimo: 2700, eloMaximo: 9999, icone: '🏆' },
]

export function determinarFaixaDoElo(elo: number): FaixaDeElo {
  for (const faixa of FAIXAS_DE_ELO) {
    if (elo >= faixa.eloMinimo && elo <= faixa.eloMaximo) {
      return faixa
    }
  }
  return FAIXAS_DE_ELO[0]!
}
