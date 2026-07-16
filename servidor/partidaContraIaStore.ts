import type { ResultadoDaRodada } from '../core/tipos/rodada'

export interface RodadaContraIa {
  numeroDaRodada: number
  token: string
  numeroDoJogador: number | null
  paridadeDoJogador: 'par' | 'impar' | null
  numeroDaIa: number | null
  paridadeDaIa: 'par' | 'impar' | null
  resultado: ResultadoDaRodada | null
  confirmada: boolean
}

export interface PartidaContraIaState {
  id: string
  nomeDoJogador: string
  rodadaAtual: number
  totalDeRodadas: number
  paridadeInicialDoPrimeiro: 'par' | 'impar'
  rodadas: RodadaContraIa[]
  finalizada: boolean
  vencedor: 'jogador' | 'ia' | null
  pontuacaoDoJogador: number
  pontuacaoDaIa: number
  createdAt: number
}

const mapDePartidas = new Map<string, PartidaContraIaState>()

const TEMPO_DE_VIDA_MS = 1000 * 60 * 30 // 30 minutos

function limparPartidasVelhas(): void {
  const agora = Date.now()
  mapDePartidas.forEach((partida, id) => {
    if (agora - partida.createdAt > TEMPO_DE_VIDA_MS) {
      mapDePartidas.delete(id)
    }
  })
}

export function buscarPartida(id: string): PartidaContraIaState | undefined {
  return mapDePartidas.get(id)
}

export function salvarPartida(partida: PartidaContraIaState): void {
  mapDePartidas.set(partida.id, partida)
}

export function atualizarPartida(
  id: string,
  atualizacao: Partial<PartidaContraIaState>
): PartidaContraIaState | undefined {
  const partida = mapDePartidas.get(id)
  if (!partida) return undefined
  const atualizada = { ...partida, ...atualizacao }
  mapDePartidas.set(id, atualizada)
  return atualizada
}

export function criarPartida(
  id: string,
  nomeDoJogador: string,
  totalDeRodadas: number,
  paridadeInicialDoPrimeiro: 'par' | 'impar'
): PartidaContraIaState {
  limparPartidasVelhas()

  const rodadas: RodadaContraIa[] = Array.from(
    { length: totalDeRodadas },
    (_, i) => ({
      numeroDaRodada: i + 1,
      token: crypto.randomUUID(),
      numeroDoJogador: null,
      paridadeDoJogador: null,
      numeroDaIa: null,
      paridadeDaIa: null,
      resultado: null,
      confirmada: false,
    })
  )

  const partida: PartidaContraIaState = {
    id,
    nomeDoJogador: nomeDoJogador.trim(),
    rodadaAtual: 1,
    totalDeRodadas,
    paridadeInicialDoPrimeiro,
    rodadas,
    finalizada: false,
    vencedor: null,
    pontuacaoDoJogador: 0,
    pontuacaoDaIa: 0,
    createdAt: Date.now(),
  }

  mapDePartidas.set(id, partida)
  return partida
}
