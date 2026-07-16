import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const nomeDoJogador = (body?.nomeDoJogador as string) ?? ''

    const nomeNormalizado = nomeDoJogador.trim() || 'Jogador'
    if (nomeNormalizado.length > 20) {
      return NextResponse.json(
        { erro: 'Nome muito longo. Use no máximo 20 caracteres.' },
        { status: 400 }
      )
    }

    // Verificar se o usuário está logado
    const supabase = await criarClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    const id = randomUUID()
    const totalDeRodadas = 3
    const supabaseAdmin = criarClienteServidorAdmin()

    const { error: erroPartida } = await supabaseAdmin.from('partidas').insert({
      id,
      modo: 'classico',
      tipo: 'contra_ia',
      id_do_primeiro_jogador: user?.id ?? null,
      id_do_segundo_jogador: null,
      status: 'em_andamento',
      total_de_rodadas_previsto: totalDeRodadas,
      rodada_atual: 1,
    })

    if (erroPartida) {
      console.error('Erro ao criar partida:', erroPartida)
      return NextResponse.json({ erro: 'Erro ao criar partida.' }, { status: 500 })
    }

    const { error: erroRodada } = await supabaseAdmin.from('rodadas').insert({
      id_da_partida: id,
      numero_da_rodada: 1,
    })

    if (erroRodada) {
      console.error('Erro ao criar rodada:', erroRodada)
      await supabaseAdmin.from('partidas').delete().eq('id', id)
      return NextResponse.json({ erro: 'Erro ao criar partida.' }, { status: 500 })
    }

    return NextResponse.json({ idDaPartida: id, totalDeRodadas, anonimo: !user })
  } catch (erro) {
    console.error('Erro ao iniciar partida contra IA:', erro)
    return NextResponse.json({ erro: 'Erro interno ao iniciar partida.' }, { status: 500 })
  }
}
