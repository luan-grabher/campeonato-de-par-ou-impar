'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

export type StatusDeEntradaNaSobrevivencia =
  | { status: 'na_fila' }
  | { status: 'partida_encontrada'; idDaPartida: string }
  | { status: 'sobrevivente_unico'; mensagem: string; idDaPartida?: string }
  | { status: 'erro'; mensagem: string }

export async function entrarNaFilaDeSobrevivencia(): Promise<StatusDeEntradaNaSobrevivencia> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    // Verificar se já está na fila de sobrevivência
    const { data: jaNaFila } = await supabase
      .from('fila_de_sobrevivencia')
      .select('id, vitorias_consecutivas')
      .eq('id_do_jogador', user.id)
      .maybeSingle()

    // Se já está na fila, apenas conta quantos estão na fila
    if (jaNaFila) {
      // Verificar se há oponentes disponíveis
      const supabaseAdminCandidatos = criarClienteServidorAdmin()
      const { count: totalNaFila } = await supabaseAdminCandidatos
        .from('fila_de_sobrevivencia')
        .select('*', { count: 'exact', head: true })

      if (totalNaFila && totalNaFila >= 2) {
        // Tentar encontrar partida
        return await tentarCriarPartida(user.id)
      }

      return { status: 'na_fila' }
    }

    // Inserir na fila de sobrevivência
    await supabase.from('fila_de_sobrevivencia').insert({
      id_do_jogador: user.id,
    })

    // Tentar encontrar oponente
    return await tentarCriarPartida(user.id)
  } catch (erro) {
    console.error('Erro ao entrar na fila de sobrevivência:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao entrar na fila.' }
  }
}

async function tentarCriarPartida(
  idDoJogador: string
): Promise<StatusDeEntradaNaSobrevivencia> {
  const supabaseAdmin = criarClienteServidorAdmin()

  // Buscar outro jogador na fila de sobrevivência
  const { data: candidatos } = await supabaseAdmin
    .from('fila_de_sobrevivencia')
    .select('id_do_jogador, vitorias_consecutivas')
    .neq('id_do_jogador', idDoJogador)
    .order('created_at', { ascending: true })

  if (!candidatos || candidatos.length === 0) {
    return { status: 'na_fila' }
  }

  // Pegar o primeiro da fila
  const oponente = candidatos[0]
  if (!oponente) {
    return { status: 'na_fila' }
  }

  const idDoOponente = oponente.id_do_jogador

  // Criar partida com modo sobrevivência
  const { data: partida, error: erroPartida } = await supabaseAdmin
    .from('partidas')
    .insert({
      modo: 'sobrevivencia',
      tipo: 'partida_rapida',
      id_do_primeiro_jogador: idDoJogador,
      id_do_segundo_jogador: idDoOponente,
      status: 'em_andamento',
      total_de_rodadas_previsto: 1,
      rodada_atual: 1,
    })
    .select('id')
    .single()

  if (erroPartida || !partida) {
    return { status: 'erro', mensagem: 'Erro ao criar partida.' }
  }

  const idDaPartida = partida.id as string

  // Remover ambos da fila de sobrevivência
  await supabaseAdmin
    .from('fila_de_sobrevivencia')
    .delete()
    .in('id_do_jogador', [idDoJogador, idDoOponente])

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
      idDoPrimeiroJogador: idDoJogador,
      idDoSegundoJogador: idDoOponente,
    },
  })

  return { status: 'partida_encontrada', idDaPartida }
}
