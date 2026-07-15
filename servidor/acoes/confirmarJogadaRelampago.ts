'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import { validarJogada } from '@/core/validacao/validarJogada'
import { calcularResultadoDaRodada } from '@/core/calculo/calcularResultadoDaRodada'
import { calcularElo } from '@/core/calculo/calcularElo'
import { INTERVALO_TRADICIONAL } from '@/core/constantes/intervalosDeNumeros'
import { K_FACTOR_PADRAO } from '@/core/constantes/pontuacao'

interface EntradaConfirmarJogadaRelampago {
  idDaPartida: string
  numeroDaRodada: number
  numeroEscolhido: number
  paridadeEscolhida: 'par' | 'impar'
  tokenDeIdempotencia: string
  /** true se o cliente atingiu o timeout e está enviando uma jogada automática */
  timeoutNoCliente?: boolean
}

type DadosDaRodadaFinalizada = {
  numeroDaRodada: number
  somaDosNumeros: number
  paridadeResultante: 'par' | 'impar'
  vencedorId: string
  primeiroJogadorVenceu: boolean
}

type DadosDaPartidaFinalizada = {
  vencedorId: string
  eloGanho: number
  eloPerdido: number
  novoEloVencedor: number
  novoEloPerdedor: number
  pontuacaoPrimeiro: number
  pontuacaoSegundo: number
}

export type ResultadoConfirmarJogadaRelampago =
  | { status: 'jogada_registrada'; dados: { numeroDaRodada: number } }
  | {
      status: 'rodada_finalizada'
      dados: DadosDaRodadaFinalizada
      partidaFinalizada?: false
    }
  | {
      status: 'partida_finalizada'
      dados: DadosDaRodadaFinalizada
      partidaFinalizada: true
      resultado: DadosDaPartidaFinalizada
    }
  | { status: 'erro'; mensagem: string }

/** Tempo limite em ms para o modo relâmpago (5 segundos) */
const TEMPO_LIMITE_RELAMPAGO_MS = 5000

/** Comportamento ao estourar o timeout: 'escolha_aleatoria' ou 'derrota_automatica' */
const ACAO_AO_TIMEOUT: 'escolha_aleatoria' | 'derrota_automatica' = 'escolha_aleatoria'

function gerarJogadaAleatoriaRelampago() {
  return {
    numero: Math.floor(Math.random() * 2) + 1,
    paridade: (Math.random() < 0.5 ? 'par' : 'impar') as 'par' | 'impar',
  }
}

export async function confirmarJogadaRelampago(
  entrada: EntradaConfirmarJogadaRelampago
): Promise<ResultadoConfirmarJogadaRelampago> {
  const { idDaPartida, numeroDaRodada, numeroEscolhido, paridadeEscolhida, tokenDeIdempotencia } =
    entrada

  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    const supabaseAdmin = criarClienteServidorAdmin()

    // Buscar partida
    const { data: partida } = await supabaseAdmin
      .from('partidas')
      .select('*')
      .eq('id', idDaPartida)
      .single()

    if (!partida) {
      return { status: 'erro', mensagem: 'Partida não encontrada.' }
    }

    if (partida.status !== 'em_andamento') {
      return { status: 'erro', mensagem: 'Partida não está em andamento.' }
    }

    if (partida.rodada_atual !== numeroDaRodada) {
      return { status: 'erro', mensagem: 'Rodada incorreta.' }
    }

    // Determinar se o jogador é o primeiro ou segundo
    const ehPrimeiro = partida.id_do_primeiro_jogador === user.id
    const ehSegundo = partida.id_do_segundo_jogador === user.id

    if (!ehPrimeiro && !ehSegundo) {
      return { status: 'erro', mensagem: 'Você não faz parte desta partida.' }
    }

    // Buscar rodada atual
    const { data: rodada } = await supabaseAdmin
      .from('rodadas')
      .select('*')
      .eq('id_da_partida', idDaPartida)
      .eq('numero_da_rodada', numeroDaRodada)
      .single()

    if (!rodada) {
      return { status: 'erro', mensagem: 'Rodada não encontrada.' }
    }

    // Verificar se o jogador já jogou esta rodada
    if (ehPrimeiro && rodada.jogada_do_primeiro_confirmada) {
      return { status: 'erro', mensagem: 'Você já jogou esta rodada.' }
    }
    if (ehSegundo && rodada.jogada_do_segundo_confirmada) {
      return { status: 'erro', mensagem: 'Você já jogou esta rodada.' }
    }

    // === SERVER-SIDE TIMEOUT CHECK ===
    let numeroParaUsar = numeroEscolhido
    let paridadeParaUsar = paridadeEscolhida
    let timeoutAconteceu = false

    // Verificar o created_at da rodada para detectar timeout
    const rodadaCriadaEm = (rodada as Record<string, unknown>).created_at
      ? new Date((rodada as Record<string, unknown>).created_at as string).getTime()
      : null

    if (rodadaCriadaEm) {
      const tempoDecorrido = Date.now() - rodadaCriadaEm
      if (tempoDecorrido > TEMPO_LIMITE_RELAMPAGO_MS) {
        timeoutAconteceu = true
      }
    }

    if (timeoutAconteceu) {
      if (ACAO_AO_TIMEOUT === 'escolha_aleatoria') {
        const jogadaAleatoria = gerarJogadaAleatoriaRelampago()
        numeroParaUsar = jogadaAleatoria.numero
        paridadeParaUsar = jogadaAleatoria.paridade
      }
    }

    // Validar jogada
    if (!timeoutAconteceu || ACAO_AO_TIMEOUT === 'derrota_automatica') {
      const validacao = validarJogada({
        numeroEscolhido: numeroParaUsar,
        intervalo: INTERVALO_TRADICIONAL,
        modo: 'relampago',
      })
      if (!validacao.valida) {
        return { status: 'erro', mensagem: validacao.erro ?? 'Jogada inválida.' }
      }
    }

    // Registrar jogada com idempotência
    const camposAtualizar: Record<string, unknown> = {}

    if (ehPrimeiro) {
      camposAtualizar.numero_do_primeiro_jogador = numeroParaUsar
      camposAtualizar.paridade_escolhida_pelo_primeiro = paridadeParaUsar
      camposAtualizar.token_de_idempotencia_do_primeiro = tokenDeIdempotencia
      camposAtualizar.jogada_do_primeiro_confirmada = true
    } else {
      camposAtualizar.numero_do_segundo_jogador = numeroParaUsar
      camposAtualizar.paridade_escolhida_pelo_segundo = paridadeParaUsar
      camposAtualizar.token_de_idempotencia_do_segundo = tokenDeIdempotencia
      camposAtualizar.jogada_do_segundo_confirmada = true
    }

    const { error: erroAtualizacao } = await supabaseAdmin
      .from('rodadas')
      .update(camposAtualizar)
      .eq('id', rodada.id)
      .is(
        ehPrimeiro ? 'token_de_idempotencia_do_primeiro' : 'token_de_idempotencia_do_segundo',
        null
      )

    if (erroAtualizacao) {
      return { status: 'erro', mensagem: 'Erro ao registrar jogada. Tente novamente.' }
    }

    // Broadcast jogada confirmada
    const channel = supabaseAdmin.channel(`partida:${idDaPartida}`)
    await channel.send({
      type: 'broadcast',
      event: 'jogada_confirmada',
      payload: {
        idDoJogador: user.id,
        numeroDaRodada,
        timeout: timeoutAconteceu,
      },
    })

    // Verificar se ambos jogaram
    const { data: rodadaAtualizada } = await supabaseAdmin
      .from('rodadas')
      .select('*')
      .eq('id', rodada.id)
      .single()

    if (!rodadaAtualizada) {
      return { status: 'erro', mensagem: 'Erro ao verificar estado da rodada.' }
    }

    const ambosJogaram =
      rodadaAtualizada.jogada_do_primeiro_confirmada &&
      rodadaAtualizada.jogada_do_segundo_confirmada

    if (!ambosJogaram) {
      return {
        status: 'jogada_registrada',
        dados: { numeroDaRodada },
      }
    }

    // === AMBOS JOGARAM — CALCULAR RESULTADO ===
    const numeroPrimeiro = rodadaAtualizada.numero_do_primeiro_jogador as number
    const numeroSegundo = rodadaAtualizada.numero_do_segundo_jogador as number
    const paridadePrimeiro = rodadaAtualizada.paridade_escolhida_pelo_primeiro as 'par' | 'impar'

    const resultado = calcularResultadoDaRodada(numeroPrimeiro, numeroSegundo, paridadePrimeiro)

    const vencedorId = resultado.primeiroJogadorVenceu
      ? partida.id_do_primeiro_jogador
      : partida.id_do_segundo_jogador

    // Atualizar rodada com resultado
    await supabaseAdmin
      .from('rodadas')
      .update({
        resultado_calculado: true,
        vencedor_id: vencedorId,
        soma_dos_numeros: resultado.somaDosNumeros,
        paridade_resultante: resultado.paridadeResultante,
      })
      .eq('id', rodada.id)

    const dadosRodadaFinalizada: DadosDaRodadaFinalizada = {
      numeroDaRodada,
      somaDosNumeros: resultado.somaDosNumeros,
      paridadeResultante: resultado.paridadeResultante,
      vencedorId: vencedorId!,
      primeiroJogadorVenceu: resultado.primeiroJogadorVenceu,
    }

    // Calcular pontuação atual (melhor de N)
    const { data: rodadasDaPartida } = await supabaseAdmin
      .from('rodadas')
      .select('vencedor_id')
      .eq('id_da_partida', idDaPartida)
      .eq('resultado_calculado', true)

    let pontuacaoPrimeiro = 0
    let pontuacaoSegundo = 0

    for (const r of rodadasDaPartida ?? []) {
      if (r.vencedor_id === partida.id_do_primeiro_jogador) {
        pontuacaoPrimeiro++
      } else if (r.vencedor_id === partida.id_do_segundo_jogador) {
        pontuacaoSegundo++
      }
    }

    const totalRodadasPrevisto = partida.total_de_rodadas_previsto as 1 | 3 | 5 | 7
    const vitoriasNecessarias = Math.ceil(totalRodadasPrevisto / 2)
    const partidaFinalizada =
      pontuacaoPrimeiro >= vitoriasNecessarias || pontuacaoSegundo >= vitoriasNecessarias

    if (partidaFinalizada) {
      // === PARTIDA FINALIZADA ===
      const vencedorFinalId =
        pontuacaoPrimeiro >= vitoriasNecessarias
          ? partida.id_do_primeiro_jogador
          : partida.id_do_segundo_jogador

      const perdedorFinalId =
        vencedorFinalId === partida.id_do_primeiro_jogador
          ? partida.id_do_segundo_jogador
          : partida.id_do_primeiro_jogador

      // Calcular Elo
      const { data: perfilVencedor } = await supabaseAdmin
        .from('perfis')
        .select('elo, total_de_vitorias, total_de_partidas, sequencia_atual')
        .eq('id_usuario', vencedorFinalId)
        .single()

      const { data: perfilPerdedor } = await supabaseAdmin
        .from('perfis')
        .select('elo, total_de_derrotas, total_de_partidas, sequencia_atual')
        .eq('id_usuario', perdedorFinalId)
        .single()

      const eloVencedor = (perfilVencedor?.elo as number) ?? 1200
      const eloPerdedor = (perfilPerdedor?.elo as number) ?? 1200

      const { novoEloDoVencedor, novoEloDoPerdedor } = calcularElo(
        eloVencedor,
        eloPerdedor,
        K_FACTOR_PADRAO
      )

      // Atualizar partida
      await supabaseAdmin
        .from('partidas')
        .update({
          status: 'finalizada',
          vencedor_id: vencedorFinalId,
          rodada_atual: numeroDaRodada,
        })
        .eq('id', idDaPartida)

      // Atualizar perfis dos jogadores
      await supabaseAdmin
        .from('perfis')
        .update({
          elo: novoEloDoVencedor,
          total_de_vitorias: (perfilVencedor?.total_de_vitorias as number ?? 0) + 1,
          total_de_partidas: (perfilVencedor?.total_de_partidas as number ?? 0) + 1,
          sequencia_atual: (perfilVencedor?.sequencia_atual as number ?? 0) + 1,
        })
        .eq('id_usuario', vencedorFinalId)

      await supabaseAdmin
        .from('perfis')
        .update({
          elo: novoEloDoPerdedor,
          total_de_derrotas: (perfilPerdedor?.total_de_derrotas as number ?? 0) + 1,
          total_de_partidas: (perfilPerdedor?.total_de_partidas as number ?? 0) + 1,
          sequencia_atual: 0,
        })
        .eq('id_usuario', perdedorFinalId)

      // Broadcast fim da partida
      await channel.send({
        type: 'broadcast',
        event: 'fim_da_partida',
        payload: {
          vencedorId: vencedorFinalId,
          eloGanho: novoEloDoVencedor - eloVencedor,
          eloPerdido: eloPerdedor - novoEloDoPerdedor,
          novoEloVencedor: novoEloDoVencedor,
          novoEloPerdedor: novoEloDoPerdedor,
          pontuacaoPrimeiro,
          pontuacaoSegundo,
        },
      })

      return {
        status: 'partida_finalizada',
        dados: dadosRodadaFinalizada,
        partidaFinalizada: true,
        resultado: {
          vencedorId: vencedorFinalId!,
          eloGanho: novoEloDoVencedor - eloVencedor,
          eloPerdido: eloPerdedor - novoEloDoPerdedor,
          novoEloVencedor: novoEloDoVencedor,
          novoEloPerdedor: novoEloDoPerdedor,
          pontuacaoPrimeiro,
          pontuacaoSegundo,
        },
      }
    }

    // === PARTIDA CONTINUA — AVANÇAR RODADA ===
    const proximaRodada = numeroDaRodada + 1

    await supabaseAdmin
      .from('partidas')
      .update({ rodada_atual: proximaRodada })
      .eq('id', idDaPartida)

    // Criar próxima rodada
    await supabaseAdmin.from('rodadas').insert({
      id_da_partida: idDaPartida,
      numero_da_rodada: proximaRodada,
    })

    // Broadcast resultado da rodada
    await channel.send({
      type: 'broadcast',
      event: 'resultado_da_rodada',
      payload: {
        ...dadosRodadaFinalizada,
        proximaRodada,
        pontuacaoPrimeiro,
        pontuacaoSegundo,
      },
    })

    return {
      status: 'rodada_finalizada',
      dados: dadosRodadaFinalizada,
    }
  } catch (erro) {
    console.error('Erro ao confirmar jogada relâmpago:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao confirmar jogada.' }
  }
}
