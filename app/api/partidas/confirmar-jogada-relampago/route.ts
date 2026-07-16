import { NextRequest, NextResponse } from 'next/server'
import { confirmarJogadaRelampago } from '@/servidor/acoes/confirmarJogadaRelampago'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { idDaPartida, numeroDaRodada, numeroEscolhido, paridadeEscolhida, tokenDeIdempotencia, timeoutNoCliente } =
      body ?? {}

    if (!idDaPartida || typeof numeroDaRodada !== 'number' || typeof numeroEscolhido !== 'number') {
      return NextResponse.json(
        { status: 'erro', mensagem: 'Parâmetros inválidos.' },
        { status: 400 }
      )
    }

    const resultado = await confirmarJogadaRelampago({
      idDaPartida,
      numeroDaRodada,
      numeroEscolhido,
      paridadeEscolhida: paridadeEscolhida ?? 'par',
      tokenDeIdempotencia: tokenDeIdempotencia ?? crypto.randomUUID(),
      timeoutNoCliente: !!timeoutNoCliente,
    })

    return NextResponse.json(resultado)
  } catch (erro) {
    console.error('Erro na API confirmar-jogada-relampago:', erro)
    return NextResponse.json(
      { status: 'erro', mensagem: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}
