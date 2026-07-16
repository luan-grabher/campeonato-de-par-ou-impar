import { NextRequest, NextResponse } from 'next/server'
import { buscarPerfilCompleto } from '@/servidor/acoes/buscarPerfilCompleto'
import { atualizarPerfil } from '@/servidor/acoes/atualizarPerfil'
import { buscarJogadorPorNome } from '@/servidor/acoes/buscarJogadorPorNome'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { acao } = body ?? {}

    switch (acao) {
      case 'buscar-perfil': {
        const resultado = await buscarPerfilCompleto()
        return NextResponse.json(resultado)
      }

      case 'atualizar-perfil': {
        const { nome, urlDoAvatar, pais } = body ?? {}
        const formData = new FormData()
        formData.set('nome', nome ?? '')
        formData.set('pais', pais ?? '')
        formData.set('urlDoAvatar', urlDoAvatar ?? '')
        const resultado = await atualizarPerfil(null, formData)
        return NextResponse.json(resultado)
      }

      case 'buscar-jogador': {
        const { nome } = body ?? {}
        if (!nome) {
          return NextResponse.json({ erro: 'Nome do jogador é obrigatório.' }, { status: 400 })
        }
        const resultado = await buscarJogadorPorNome(nome)
        return NextResponse.json(resultado)
      }

      default:
        return NextResponse.json({ erro: 'Ação inválida.' }, { status: 400 })
    }
  } catch (erro) {
    console.error('Erro na API perfil:', erro)
    return NextResponse.json({ erro: 'Erro interno do servidor.' }, { status: 500 })
  }
}
