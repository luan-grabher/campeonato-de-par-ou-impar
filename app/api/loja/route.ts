import { NextRequest, NextResponse } from 'next/server'
import { buscarTodasAsConquistas } from '@/servidor/acoes/buscarTodasAsConquistas'
import { buscarConquistasDoJogador } from '@/servidor/acoes/buscarConquistasDoJogador'
import { buscarInventarioDoJogador } from '@/servidor/acoes/buscarInventarioDoJogador'
import { buscarCosmeticosDisponiveis } from '@/servidor/acoes/buscarCosmeticosDisponiveis'
import { comprarCosmetico } from '@/servidor/acoes/comprarCosmetico'
import { equiparCosmetico } from '@/servidor/acoes/equiparCosmetico'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { acao } = body ?? {}

    switch (acao) {
      case 'buscar-conquistas': {
        const resultado = await buscarTodasAsConquistas()
        return NextResponse.json(resultado)
      }

      case 'buscar-conquistas-jogador': {
        const resultado = await buscarConquistasDoJogador()
        return NextResponse.json(resultado)
      }

      case 'buscar-inventario': {
        const resultado = await buscarInventarioDoJogador()
        return NextResponse.json(resultado)
      }

      case 'buscar-cosmeticos': {
        const resultado = await buscarCosmeticosDisponiveis()
        return NextResponse.json(resultado)
      }

      case 'comprar-cosmetico': {
        const { idDoCosmetico } = body ?? {}
        if (!idDoCosmetico) {
          return NextResponse.json({ erro: 'ID do cosmético é obrigatório.' }, { status: 400 })
        }
        const resultado = await comprarCosmetico(idDoCosmetico)
        return NextResponse.json(resultado)
      }

      case 'equipar-cosmetico': {
        const { idDoCosmetico, equipar } = body ?? {}
        if (!idDoCosmetico) {
          return NextResponse.json({ erro: 'ID do cosmético é obrigatório.' }, { status: 400 })
        }
        const resultado = await equiparCosmetico(idDoCosmetico, equipar ?? true)
        return NextResponse.json(resultado)
      }

      default:
        return NextResponse.json({ erro: 'Ação inválida.' }, { status: 400 })
    }
  } catch (erro) {
    console.error('Erro na API loja:', erro)
    return NextResponse.json({ erro: 'Erro interno do servidor.' }, { status: 500 })
  }
}
