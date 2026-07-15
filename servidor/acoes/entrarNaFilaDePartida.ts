'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

export type StatusDeEntradaNaFila =
  | { status: 'na_fila' }
  | { status: 'partida_encontrada'; idDaPartida: string }
  | { status: 'erro'; mensagem: string }

export async function entrarNaFilaDePartida(): Promise<StatusDeEntradaNaFila> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    // Verificar se já está na fila
    const { data: jaNaFila } = await supabase
      .from('fila_de_partida_rapida')
      .select('id')
      .eq('id_do_jogador', user.id)
      .maybeSingle()

    if (jaNaFila) {
      return { status: 'na_fila' }
    }

    // Buscar elo do jogador
    const { data: perfil } = await supabase
      .from('perfis')
      .select('elo')
      .eq('id_usuario', user.id)
      .single()

    if (!perfil) {
      return { status: 'erro', mensagem: 'Perfil não encontrado.' }
    }

    const eloDoJogador = perfil.elo as number

    // Inserir na fila
    await supabase.from('fila_de_partida_rapida').insert({
      id_do_jogador: user.id,
    })

    // Tentar encontrar oponente (elo mais próximo)
    const supabaseAdmin = criarClienteServidorAdmin()

    const { data: candidatos } = await supabaseAdmin
      .from('fila_de_partida_rapida')
      .select('id_do_jogador, perfis!inner(elo)')
      .neq('id_do_jogador', user.id)
      .order('created_at', { ascending: true })

    if (!candidatos || candidatos.length === 0) {
      return { status: 'na_fila' }
    }

    // Encontrar candidato com elo mais próximo
    let melhorCandidato: string | null = null
    let menorDiferenca = Infinity

    for (const candidato of candidatos) {
      const perfilCandidato = candidato.perfis as unknown as { elo: number }
      if (perfilCandidato && typeof perfilCandidato.elo === 'number') {
        const diferenca = Math.abs(perfilCandidato.elo - eloDoJogador)
        if (diferenca < menorDiferenca) {
          menorDiferenca = diferenca
          melhorCandidato = candidato.id_do_jogador
        }
      }
    }

    if (!melhorCandidato) {
      return { status: 'na_fila' }
    }

    // Criar partida
    const { data: partida, error: erroPartida } = await supabaseAdmin
      .from('partidas')
      .insert({
        modo: 'classico',
        tipo: 'partida_rapida',
        id_do_primeiro_jogador: user.id,
        id_do_segundo_jogador: melhorCandidato,
        status: 'em_andamento',
        total_de_rodadas_previsto: 3,
        rodada_atual: 1,
      })
      .select('id')
      .single()

    if (erroPartida || !partida) {
      return { status: 'erro', mensagem: 'Erro ao criar partida.' }
    }

    const idDaPartida = partida.id as string

    // Remover ambos da fila
    await supabaseAdmin
      .from('fila_de_partida_rapida')
      .delete()
      .in('id_do_jogador', [user.id, melhorCandidato])

    // Criar primeira rodada
    await supabaseAdmin.from('rodadas').insert({
      id_da_partida: idDaPartida,
      numero_da_rodada: 1,
    })

    // Broadcast Realtime para ambos os jogadores
    const channel = supabaseAdmin.channel(`partida:${idDaPartida}`)

    await channel.send({
      type: 'broadcast',
      event: 'partida_encontrada',
      payload: {
        idDaPartida,
        idDoPrimeiroJogador: user.id,
        idDoSegundoJogador: melhorCandidato,
      },
    })

    return { status: 'partida_encontrada', idDaPartida }
  } catch (erro) {
    console.error('Erro ao entrar na fila:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao entrar na fila.' }
  }
}
