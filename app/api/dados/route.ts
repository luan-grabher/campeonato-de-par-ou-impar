import { NextRequest, NextResponse } from 'next/server'
import { buscarRanking } from '@/servidor/acoes/buscarRanking'
import { buscarHistoricoDePartidas } from '@/servidor/acoes/buscarHistoricoDePartidas'
import { buscarReplayDaPartida } from '@/servidor/acoes/buscarReplayDaPartida'
import { buscarEstatisticasDoAdversario } from '@/servidor/acoes/buscarEstatisticasDoAdversario'
import { buscarTemporadaAtual } from '@/servidor/acoes/buscarTemporadaAtual'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { acao } = body ?? {}

    switch (acao) {
      case 'buscar-ranking': {
        const resultado = await buscarRanking()
        return NextResponse.json(resultado)
      }

      case 'buscar-historico': {
        const { tipo, pagina, limite } = body ?? {}
        const resultado = await buscarHistoricoDePartidas(tipo ?? 'todas', pagina ?? 1)
        return NextResponse.json(resultado)
      }

      case 'buscar-replay': {
        const { idDaPartida } = body ?? {}
        if (!idDaPartida) {
          return NextResponse.json({ erro: 'ID da partida é obrigatório.' }, { status: 400 })
        }
        const resultado = await buscarReplayDaPartida(idDaPartida)
        return NextResponse.json(resultado)
      }

      case 'buscar-estatisticas': {
        const { idDoAdversario } = body ?? {}
        if (!idDoAdversario) {
          return NextResponse.json({ erro: 'ID do adversário é obrigatório.' }, { status: 400 })
        }
        const resultado = await buscarEstatisticasDoAdversario(idDoAdversario)
        return NextResponse.json(resultado)
      }

      case 'buscar-temporada': {
        const resultado = await buscarTemporadaAtual()
        return NextResponse.json(resultado)
      }

      default:
        return NextResponse.json({ erro: 'Ação inválida.' }, { status: 400 })
    }
  } catch (erro) {
    console.error('Erro na API dados:', erro)
    return NextResponse.json({ erro: 'Erro interno do servidor.' }, { status: 500 })
  }
}
