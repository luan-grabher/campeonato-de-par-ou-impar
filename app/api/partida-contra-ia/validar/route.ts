import { NextRequest, NextResponse } from 'next/server'
import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { idDaPartida } = body ?? {}

    if (!idDaPartida || typeof idDaPartida !== 'string') {
      return NextResponse.json(
        { valida: false, erro: 'ID da partida é obrigatório.' },
        { status: 400 }
      )
    }

    const supabaseAdmin = criarClienteServidorAdmin()

    const { data: partida, error: erroBusca } = await supabaseAdmin
      .from('partidas')
      .select('id, status')
      .eq('id', idDaPartida)
      .single()

    if (erroBusca || !partida) {
      return NextResponse.json({ valida: false })
    }

    if (partida.status !== 'em_andamento') {
      return NextResponse.json({ valida: false })
    }

    // Resolver nome do jogador a partir da sessão
    const supabase = await criarClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    const nomeDoJogador =
      user?.user_metadata?.apelido ??
      user?.user_metadata?.nome_de_usuario ??
      user?.email?.split('@')[0] ??
      'Jogador'

    return NextResponse.json({ valida: true, nomeDoJogador })
  } catch (erro) {
    console.error('Erro ao validar partida:', erro)
    return NextResponse.json({ valida: false, erro: 'Erro interno ao validar partida.' }, { status: 500 })
  }
}
