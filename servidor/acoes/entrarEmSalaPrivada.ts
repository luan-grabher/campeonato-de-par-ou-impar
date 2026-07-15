'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

export type ResultadoEntrarEmSala =
  | { status: 'sucesso'; idDaPartida: string }
  | { status: 'erro'; mensagem: string }

export async function entrarEmSalaPrivada(
  codigo: string
): Promise<ResultadoEntrarEmSala> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    if (!codigo || codigo.trim().length !== 6) {
      return { status: 'erro', mensagem: 'Código inválido.' }
    }

    const codigoNormalizado = codigo.trim().toUpperCase()

    const supabaseAdmin = criarClienteServidorAdmin()

    // Buscar sala pelo código
    const { data: sala, error: erroBusca } = await supabaseAdmin
      .from('salas_privadas')
      .select('*')
      .eq('codigo', codigoNormalizado)
      .single()

    if (erroBusca || !sala) {
      return { status: 'erro', mensagem: 'Sala não encontrada.' }
    }

    if (sala.status !== 'aguardando_oponente') {
      return { status: 'erro', mensagem: 'Esta sala não está mais aceitando jogadores.' }
    }

    if (sala.id_do_anfitriao === user.id) {
      return { status: 'erro', mensagem: 'Você é o anfitrião desta sala.' }
    }

    // Verificar se o jogador já está em alguma partida nesta sala
    const { data: partidaExistente } = await supabaseAdmin
      .from('partidas')
      .select('id')
      .eq('id_da_sala', sala.id)
      .maybeSingle()

    if (partidaExistente) {
      return { status: 'erro', mensagem: 'Esta sala já possui uma partida ativa.' }
    }

    // Atualizar status da sala
    await supabaseAdmin
      .from('salas_privadas')
      .update({ status: 'em_andamento' })
      .eq('id', sala.id)

    // Criar partida vinculada à sala
    const { data: partida, error: erroPartida } = await supabaseAdmin
      .from('partidas')
      .insert({
        modo: sala.modo_de_jogo,
        tipo: 'sala_privada',
        id_do_primeiro_jogador: sala.id_do_anfitriao,
        id_do_segundo_jogador: user.id,
        id_da_sala: sala.id,
        status: 'em_andamento',
        total_de_rodadas_previsto: sala.total_de_rodadas,
        rodada_atual: 1,
      })
      .select('id')
      .single()

    if (erroPartida || !partida) {
      // Reverter status da sala
      await supabaseAdmin
        .from('salas_privadas')
        .update({ status: 'aguardando_oponente' })
        .eq('id', sala.id)

      return { status: 'erro', mensagem: 'Erro ao criar partida.' }
    }

    const idDaPartida = partida.id as string

    // Criar primeira rodada
    await supabaseAdmin.from('rodadas').insert({
      id_da_partida: idDaPartida,
      numero_da_rodada: 1,
    })

    // Broadcast para o anfitrião via Realtime
    const channel = supabaseAdmin.channel(`sala:${sala.id}`)
    await channel.send({
      type: 'broadcast',
      event: 'jogador_entrou',
      payload: {
        idDaPartida,
        idDoSegundoJogador: user.id,
        nomeDoSegundoJogador: user.user_metadata?.name ?? 'Jogador',
      },
    })

    return { status: 'sucesso', idDaPartida }
  } catch (erro) {
    console.error('Erro ao entrar em sala privada:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao entrar na sala.' }
  }
}
