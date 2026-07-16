import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import { sortearParidadeInicial } from '@/core/calculo/atribuirParidade'

export async function POST(req: NextRequest) {
  try {
    // Verificar se o usuário está logado
    const supabase = await criarClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    // Resolver nome do jogador
    const nomeDoJogador =
      user?.user_metadata?.apelido ??
      user?.user_metadata?.nome_de_usuario ??
      user?.email?.split('@')[0] ??
      'Jogador'

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
      paridade_inicial_do_primeiro: sortearParidadeInicial(),
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

    return NextResponse.json({ idDaPartida: id, totalDeRodadas, anonimo: !user, nomeDoJogador })
  } catch (erro) {
    console.error('Erro ao iniciar partida contra IA:', erro)
    return NextResponse.json({ erro: 'Erro interno ao iniciar partida.' }, { status: 500 })
  }
}
