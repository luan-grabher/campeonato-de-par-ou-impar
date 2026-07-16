import { NextRequest, NextResponse } from 'next/server'
import { buscarListaDeAmigos } from '@/servidor/acoes/buscarListaDeAmigos'
import { enviarConviteDeAmizade } from '@/servidor/acoes/enviarConviteDeAmizade'
import { aceitarConviteDeAmizade } from '@/servidor/acoes/aceitarConviteDeAmizade'
import { recusarConviteDeAmizade } from '@/servidor/acoes/recusarConviteDeAmizade'
import { removerAmigo } from '@/servidor/acoes/removerAmigo'
import { buscarConvitesPendentes } from '@/servidor/acoes/buscarConvitesPendentes'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { acao } = body ?? {}

    switch (acao) {
      case 'buscar-lista': {
        const resultado = await buscarListaDeAmigos()
        return NextResponse.json(resultado)
      }

      case 'buscar-convites': {
        const resultado = await buscarConvitesPendentes()
        return NextResponse.json(resultado)
      }

      case 'enviar-convite': {
        const { idDoDestinatario } = body ?? {}
        if (!idDoDestinatario) {
          return NextResponse.json({ erro: 'ID do destinatário é obrigatório.' }, { status: 400 })
        }
        const resultado = await enviarConviteDeAmizade(idDoDestinatario)
        return NextResponse.json(resultado)
      }

      case 'aceitar-convite': {
        const { idDoConvite } = body ?? {}
        if (!idDoConvite) {
          return NextResponse.json({ erro: 'ID do convite é obrigatório.' }, { status: 400 })
        }
        const resultado = await aceitarConviteDeAmizade(idDoConvite)
        return NextResponse.json(resultado)
      }

      case 'recusar-convite': {
        const { idDoConvite } = body ?? {}
        if (!idDoConvite) {
          return NextResponse.json({ erro: 'ID do convite é obrigatório.' }, { status: 400 })
        }
        const resultado = await recusarConviteDeAmizade(idDoConvite)
        return NextResponse.json(resultado)
      }

      case 'remover-amigo': {
        const { idDoAmigo } = body ?? {}
        if (!idDoAmigo) {
          return NextResponse.json({ erro: 'ID do amigo é obrigatório.' }, { status: 400 })
        }
        const resultado = await removerAmigo(idDoAmigo)
        return NextResponse.json(resultado)
      }

      default:
        return NextResponse.json({ erro: 'Ação inválida.' }, { status: 400 })
    }
  } catch (erro) {
    console.error('Erro na API amigos:', erro)
    return NextResponse.json({ erro: 'Erro interno do servidor.' }, { status: 500 })
  }
}
