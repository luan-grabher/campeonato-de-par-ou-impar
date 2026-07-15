import type { PerfilDoJogador, EstatisticasDoJogador } from '../tipos/jogador'

interface HistoricoDeJogada {
  numero: number
  paridade: string
}

export function calcularFrequenciaDosNumeros(
  historico: HistoricoDeJogada[]
): Record<number, number> {
  const frequencia: Record<number, number> = {}

  for (const jogada of historico) {
    const valorAtual = frequencia[jogada.numero] ?? 0
    frequencia[jogada.numero] = valorAtual + 1
  }

  return frequencia
}

export function calcularEstatisticasDoJogador(
  perfil: PerfilDoJogador,
  historico: HistoricoDeJogada[]
): EstatisticasDoJogador {
  const totalDePartidas = perfil.totalDeVitorias + perfil.totalDeDerrotas
  const taxaDeVitoria = totalDePartidas > 0
    ? perfil.totalDeVitorias / totalDePartidas
    : 0

  const frequenciaDosNumeros = calcularFrequenciaDosNumeros(historico)
  const totalDeJogadas = historico.length

  let totalDePares = 0
  let totalDeImpares = 0

  for (const jogada of historico) {
    if (jogada.numero % 2 === 0) {
      totalDePares++
    } else {
      totalDeImpares++
    }
  }

  const frequenciaDePares = totalDeJogadas > 0 ? totalDePares / totalDeJogadas : 0
  const frequenciaDeImpares = totalDeJogadas > 0 ? totalDeImpares / totalDeJogadas : 0

  return {
    taxaDeVitoria,
    frequenciaDosNumeros,
    frequenciaDePares,
    frequenciaDeImpares,
    tempoMedioPorJogada: 0,
  }
}
