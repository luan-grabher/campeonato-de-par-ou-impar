import { NextRequest, NextResponse } from 'next/server'
import { buscarSalaPorCodigo } from '@/servidor/acoes/buscarSalaPorCodigo'
import { criarSalaPrivada } from '@/servidor/acoes/criarSalaPrivada'
import { entrarEmSalaPrivada } from '@/servidor/acoes/entrarEmSalaPrivada'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { acao } = body ?? {}

    switch (acao) {
      case 'buscar-sala': {
        const { codigo } = body ?? {}
        if (!codigo) {
          return NextResponse.json({ erro: 'Código da sala é obrigatório.' }, { status: 400 })
        }
        const resultado = await buscarSalaPorCodigo(codigo)
        return NextResponse.json(resultado)
      }

      case 'criar-sala': {
        const { nome, maximoDeJogadores, privacidade, titulo, totalDeRodadas, modoDeJogo } = body ?? {}
        const resultado = await criarSalaPrivada({
          titulo: titulo ?? nome ?? 'Sala Privada',
          totalDeRodadas: totalDeRodadas ?? 3,
          modoDeJogo: modoDeJogo ?? 'classico',
        })
        return NextResponse.json(resultado)
      }

      case 'entrar-na-sala': {
        const { codigo } = body ?? {}
        if (!codigo) {
          return NextResponse.json({ erro: 'Código da sala é obrigatório.' }, { status: 400 })
        }
        const resultado = await entrarEmSalaPrivada(codigo)
        return NextResponse.json(resultado)
      }

      default:
        return NextResponse.json({ erro: 'Ação inválida.' }, { status: 400 })
    }
  } catch (erro) {
    console.error('Erro na API salas:', erro)
    return NextResponse.json({ erro: 'Erro interno do servidor.' }, { status: 500 })
  }
}
