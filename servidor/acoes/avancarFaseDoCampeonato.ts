'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

export type ResultadoAvancarFase =
  | { status: 'sucesso'; finalizado?: boolean; campeaoId?: string }
  | { status: 'erro'; mensagem: string }

export async function avancarFaseDoCampeonato(
  idDaPartida: string
): Promise<ResultadoAvancarFase> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    const supabaseAdmin = criarClienteServidorAdmin()

    // Buscar partida atual
    const { data: partida, error: erroPartida } = await supabaseAdmin
      .from('partidas')
      .select('*, campeonatos!inner(id, nome, status, total_de_jogadores)')
      .eq('id', idDaPartida)
      .single()

    if (erroPartida || !partida) {
      return { status: 'erro', mensagem: 'Partida não encontrada.' }
    }

    // Verificar se a partida pertence a um campeonato
    if (partida.tipo !== 'campeonato' || !partida.id_do_campeonato) {
      return { status: 'erro', mensagem: 'Esta partida não pertence a um campeonato.' }
    }

    // Verificar se a partida já foi finalizada e tem vencedor
    if (partida.status !== 'finalizada' || !partida.vencedor_id) {
      return { status: 'erro', mensagem: 'Partida ainda não foi finalizada.' }
    }

    const campeonato = partida.campeonatos as unknown as {
      id: string
      nome: string
      status: string
      total_de_jogadores: number
    }

    const idDoCampeonato = campeonato.id
    const totalDeJogadores = campeonato.total_de_jogadores
    const idDoVencedor = partida.vencedor_id

    // Buscar total de partidas existentes no campeonato
    const { count: totalDePartidas } = await supabaseAdmin
      .from('partidas')
      .select('*', { count: 'exact', head: true })
      .eq('id_do_campeonato', idDoCampeonato)

    const totalPartidas = totalDePartidas ?? 0

    // Calcular quantas partidas devem existir ao todo: N-1 (ex: 8 jogadores = 7 partidas)
    const totalDePartidasNoCampeonato = totalDeJogadores - 1

    // Verificar se esta é a final
    if (totalPartidas >= totalDePartidasNoCampeonato) {
      // Última partida do campeonato — final
      // Atualizar status do campeonato para finalizado
      await supabaseAdmin
        .from('campeonatos')
        .update({ status: 'finalizado' })
        .eq('id', idDoCampeonato)

      // Atualizar posicao_final dos participantes
      // Vencedor = posição 1
      await supabaseAdmin
        .from('participantes_do_campeonato')
        .update({ posicao_final: 1 })
        .eq('id_do_campeonato', idDoCampeonato)
        .eq('id_do_jogador', idDoVencedor)

      // Perdedor da final = posição 2
      const idDoPerdedorDaFinal =
        partida.id_do_primeiro_jogador === idDoVencedor
          ? partida.id_do_segundo_jogador
          : partida.id_do_primeiro_jogador

      if (idDoPerdedorDaFinal) {
        await supabaseAdmin
          .from('participantes_do_campeonato')
          .update({ posicao_final: 2 })
          .eq('id_do_campeonato', idDoCampeonato)
          .eq('id_do_jogador', idDoPerdedorDaFinal)
      }

      return {
        status: 'sucesso',
        finalizado: true,
        campeaoId: idDoVencedor as string,
      }
    }

    // Não é a final — criar partida da próxima fase
    // Determinar a qual fase pertence a partida atual e qual a posição
    // As partidas são criadas em ordem: fase 1 (N/2 partidas), fase 2 (N/4), etc.
    const totalDePartidasNaPrimeiraFase = totalDeJogadores / 2

    // Encontrar a fase da partida atual
    let faseAtual = 1
    let acumulador = 0
    for (let f = 1; f <= Math.log2(totalDeJogadores); f++) {
      const partidasNaFase = totalDePartidasNaPrimeiraFase / Math.pow(2, f - 1)
      if (totalPartidas <= acumulador + partidasNaFase) {
        faseAtual = f
        break
      }
      acumulador += partidasNaFase
    }

    // Qual posição esta partida ocupa dentro da sua fase?
    const partidasNaFaseAtual = totalDePartidasNaPrimeiraFase / Math.pow(2, faseAtual - 1)
    const posicaoNaFase = totalPartidas - acumulador - 1

    // A partida da próxima fase será na posição posicaoNaFase / 2
    const posicaoNaProximaFase = Math.floor(posicaoNaFase / 2)

    // Buscar se já existe partida na próxima fase nesta posição
    const partidasDaProximaFase = totalDePartidasNaPrimeiraFase / Math.pow(2, faseAtual)
    const inicioDaProximaFase = acumulador + partidasNaFaseAtual

    const { data: partidasProximaFase } = await supabaseAdmin
      .from('partidas')
      .select('id, id_do_primeiro_jogador, id_do_segundo_jogador')
      .eq('id_do_campeonato', idDoCampeonato)
      .order('created_at', { ascending: true })

    // Verificar se a partida da próxima fase já foi criada
    const partidaProximaFase = partidasProximaFase
      ? partidasProximaFase[inicioDaProximaFase + posicaoNaProximaFase]
      : null

    if (partidaProximaFase) {
      // Atualizar partida existente com o vencedor
      const campoVazio = !partidaProximaFase.id_do_primeiro_jogador
        ? 'id_do_primeiro_jogador'
        : !partidaProximaFase.id_do_segundo_jogador
          ? 'id_do_segundo_jogador'
          : null

      if (!campoVazio) {
        return { status: 'erro', mensagem: 'Partida da próxima fase já está completa.' }
      }

      await supabaseAdmin
        .from('partidas')
        .update({ [campoVazio]: idDoVencedor })
        .eq('id', partidaProximaFase.id)
    } else {
      // Criar nova partida na próxima fase
      const ehFinal = faseAtual + 1 >= Math.log2(totalDeJogadores)
      const totalDeRodadasPrevisto = ehFinal ? 5 : 3

      await supabaseAdmin.from('partidas').insert({
        modo: 'classico',
        tipo: 'campeonato',
        id_do_primeiro_jogador: idDoVencedor,
        id_do_segundo_jogador: null,
        id_do_campeonato: idDoCampeonato,
        status: 'aguardando_jogadores',
        total_de_rodadas_previsto: totalDeRodadasPrevisto,
      })
    }

    return { status: 'sucesso' }
  } catch (erro) {
    console.error('Erro inesperado ao avançar fase:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao avançar fase do campeonato.' }
  }
}
