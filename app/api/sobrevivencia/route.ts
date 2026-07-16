import { NextRequest, NextResponse } from 'next/server'
import { entrarNaFilaDeSobrevivencia } from '@/servidor/acoes/entrarNaFilaDeSobrevivencia'
import { sairDaFilaDeSobrevivencia } from '@/servidor/acoes/sairDaFilaDeSobrevivencia'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { acao } = body ?? {}

    if (acao === 'entrar') {
      const resultado = await entrarNaFilaDeSobrevivencia()
      return NextResponse.json(resultado)
    }

    if (acao === 'sair') {
      const resultado = await sairDaFilaDeSobrevivencia()
      return NextResponse.json(resultado)
    }

    return NextResponse.json({ erro: 'Ação inválida. Use "entrar" ou "sair".' }, { status: 400 })
  } catch (erro) {
    console.error('Erro na API sobrevivencia:', erro)
    return NextResponse.json({ erro: 'Erro interno do servidor.' }, { status: 500 })
  }
}
