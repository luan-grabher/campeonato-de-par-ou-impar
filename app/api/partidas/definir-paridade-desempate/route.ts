import { NextRequest, NextResponse } from 'next/server'
import { definirParidadeDoDesempate } from '@/servidor/acoes/definirParidadeDoDesempate'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { idDaPartida, paridadeEscolhida } = body ?? {}

    if (!idDaPartida || !paridadeEscolhida || (paridadeEscolhida !== 'par' && paridadeEscolhida !== 'impar')) {
      return NextResponse.json(
        { status: 'erro', mensagem: 'Parâmetros inválidos.' },
        { status: 400 }
      )
    }

    const resultado = await definirParidadeDoDesempate(idDaPartida, paridadeEscolhida)

    return NextResponse.json(resultado)
  } catch (erro) {
    console.error('Erro na API definir-paridade-desempate:', erro)
    return NextResponse.json(
      { status: 'erro', mensagem: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}
