import { NextRequest, NextResponse } from 'next/server'
import { buscarCampeonatosAtivos } from '@/servidor/acoes/buscarCampeonatosAtivos'
import { criarCampeonato } from '@/servidor/acoes/criarCampeonato'
import { inscreverNoCampeonato } from '@/servidor/acoes/inscreverNoCampeonato'
import { cancelarInscricaoNoCampeonato } from '@/servidor/acoes/cancelarInscricaoNoCampeonato'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { acao } = body ?? {}

    switch (acao) {
      case 'buscar-ativos':
      case 'listar': {
        const resultado = await buscarCampeonatosAtivos()
        return NextResponse.json(resultado)
      }

      case 'criar': {
        const { nome, tipo, maximoDeParticipantes, dataDeInicio, totalDeJogadores } = body ?? {}
        const resultado = await criarCampeonato({
          nome,
          totalDeJogadores: totalDeJogadores ?? maximoDeParticipantes,
        })
        return NextResponse.json(resultado)
      }

      case 'inscrever': {
        const { idDoCampeonato, idDeCampeonato } = body ?? {}
        const id = idDoCampeonato ?? idDeCampeonato
        if (!id) {
          return NextResponse.json({ erro: 'ID do campeonato é obrigatório.' }, { status: 400 })
        }
        const resultado = await inscreverNoCampeonato(id)
        return NextResponse.json(resultado)
      }

      case 'cancelar-inscricao': {
        const { idDoCampeonato, idDeCampeonato } = body ?? {}
        const id = idDoCampeonato ?? idDeCampeonato
        if (!id) {
          return NextResponse.json({ erro: 'ID do campeonato é obrigatório.' }, { status: 400 })
        }
        const resultado = await cancelarInscricaoNoCampeonato(id)
        return NextResponse.json(resultado)
      }

      default:
        return NextResponse.json({ erro: 'Ação inválida.' }, { status: 400 })
    }
  } catch (erro) {
    console.error('Erro na API campeonatos:', erro)
    return NextResponse.json({ erro: 'Erro interno do servidor.' }, { status: 500 })
  }
}
