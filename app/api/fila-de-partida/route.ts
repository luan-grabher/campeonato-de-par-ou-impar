import { NextRequest, NextResponse } from 'next/server'
import { entrarNaFilaDePartida } from '@/servidor/acoes/entrarNaFilaDePartida'
import { sairDaFilaDePartida } from '@/servidor/acoes/sairDaFilaDePartida'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { acao } = body ?? {}

    if (acao === 'entrar') {
      const resultado = await entrarNaFilaDePartida()
      return NextResponse.json(resultado)
    }

    if (acao === 'sair') {
      const resultado = await sairDaFilaDePartida()
      return NextResponse.json(resultado)
    }

    return NextResponse.json(
      { status: 'erro', mensagem: 'Ação inválida. Use "entrar" ou "sair".' },
      { status: 400 }
    )
  } catch (erro) {
    console.error('Erro na API fila-de-partida:', erro)
    return NextResponse.json(
      { status: 'erro', mensagem: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}
