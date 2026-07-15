'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import { validarJogada } from '@/core/validacao/validarJogada'
import { calcularResultadoDaRodada } from '@/core/calculo/calcularResultadoDaRodada'
import { calcularResultadoDoModoInvisivel } from '@/core/calculo/calcularResultadoDoModoInvisivel'
import { calcularElo } from '@/core/calculo/calcularElo'
import { INTERVALO_TRADICIONAL, gerarIntervaloDoCaos } from '@/core/constantes/intervalosDeNumeros'
import { K_FACTOR_PADRAO } from '@/core/constantes/pontuacao'
import { verificarConquistas, type ConquistaNova } from '@/servidor/acoes/verificarConquistas'
import { salvarReplay } from '@/servidor/acoes/salvarReplay'
import type { DadosDoReplay, RodadaDoReplay, JogadorDoReplay } from '@/core/tipos/replay'

interface EntradaConfirmarJogada {
  idDaPartida: string
  numeroDaRodada: number
  numeroEscolhido: number
  paridadeEscolhida: 'par' | 'impar'
  tokenDeIdempotencia: string
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
  conquistasNovas: ConquistaNova[]
}

export type ResultadoConfirmarJogada =
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

export async function confirmarJogada(
  entrada: EntradaConfirmarJogada
): Promise<ResultadoConfirmarJogada> {
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

    // Validar jogada (número dentro do intervalo)
    const validacao = validarJogada({
      numeroEscolhido,
      intervalo: INTERVALO_TRADICIONAL,
      modo: 'classico',
    })

    if (!validacao.valida) {
      return { status: 'erro', mensagem: validacao.erro ?? 'Jogada inválida.' }
    }

    const supabaseAdmin = criarClienteServidorAdmin()

    // Buscar partida e rodada atual
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

    // Verificar se é a rodada certa
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

    // Validação específica por modo (após conhecer partida.modo e rodada.id)
    if (partida.modo === 'caos') {
      const intervaloCaos = gerarIntervaloDoCaos(rodada.id)
      if (numeroEscolhido < intervaloCaos.minimo || numeroEscolhido > intervaloCaos.maximo) {
        return {
          status: 'erro',
          mensagem: `No modo Caos, o número precisa estar entre ${intervaloCaos.minimo} e ${intervaloCaos.maximo}.`,
        }
      }
    }

    // Registrar jogada com idempotência (ON CONFLICT DO NOTHING)
    const camposAtualizar: Record<string, unknown> = {}

    if (ehPrimeiro) {
      camposAtualizar.numero_do_primeiro_jogador = numeroEscolhido
      camposAtualizar.paridade_escolhida_pelo_primeiro = paridadeEscolhida
      camposAtualizar.token_de_idempotencia_do_primeiro = tokenDeIdempotencia
      camposAtualizar.jogada_do_primeiro_confirmada = true
    } else {
      camposAtualizar.numero_do_segundo_jogador = numeroEscolhido
      camposAtualizar.paridade_escolhida_pelo_segundo = paridadeEscolhida
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

    let resultado: ReturnType<typeof calcularResultadoDaRodada>
    let paridadeSorteada: 'par' | 'impar' | null = null

    if (partida.modo === 'invisivel') {
      // Modo Invisível: sorteia quem fica com Par
      const resultadoInvisivel = calcularResultadoDoModoInvisivel(numeroPrimeiro, numeroSegundo)
      const soma = numeroPrimeiro + numeroSegundo
      const paridadeReal = soma % 2 === 0 ? 'par' : 'impar'
      resultado = {
        somaDosNumeros: soma,
        paridadeResultante: paridadeReal,
        primeiroJogadorVenceu: resultadoInvisivel.primeiroJogadorVenceu,
      }
      paridadeSorteada = resultadoInvisivel.paridadeSorteada
    } else {
      resultado = calcularResultadoDaRodada(
        numeroPrimeiro,
        numeroSegundo,
        paridadePrimeiro
      )
    }

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

    // Calcular pontuação atual (melhor de 3)
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

      // Verificar conquistas para o vencedor (após atualizar estatísticas)
      const { conquistasNovas } = await verificarConquistas(vencedorFinalId)

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
          conquistasNovas,
        },
      })

      // === SALVAR REPLAY ===
      try {
        // Buscar todas as rodadas completas para o replay
        const { data: rodadasCompletas } = await supabaseAdmin
          .from('rodadas')
          .select('numero_da_rodada, numero_do_primeiro_jogador, paridade_escolhida_pelo_primeiro, numero_do_segundo_jogador, paridade_escolhida_pelo_segundo, vencedor_id, soma_dos_numeros, paridade_resultante')
          .eq('id_da_partida', idDaPartida)
          .eq('resultado_calculado', true)

        // Buscar perfis dos jogadores
        const { data: perfilPrimeiro } = await supabaseAdmin
          .from('perfis')
          .select('id_usuario, nome, elo, url_do_avatar')
          .eq('id_usuario', partida.id_do_primeiro_jogador)
          .single()

        const { data: perfilSegundo } = await supabaseAdmin
          .from('perfis')
          .select('id_usuario, nome, elo, url_do_avatar')
          .eq('id_usuario', partida.id_do_segundo_jogador)
          .single()

        if (rodadasCompletas && perfilPrimeiro && perfilSegundo) {
          const rodadasDoReplay: RodadaDoReplay[] = rodadasCompletas
            .filter((r) => r.numero_do_primeiro_jogador != null && r.numero_do_segundo_jogador != null)
            .map((r) => ({
              numero: r.numero_da_rodada as number,
              jogadaPrimeiro: {
                numero: r.numero_do_primeiro_jogador as number,
                paridade: (r.paridade_escolhida_pelo_primeiro as 'par' | 'impar') ?? 'par',
              },
              jogadaSegundo: {
                numero: r.numero_do_segundo_jogador as number,
                paridade: (r.paridade_escolhida_pelo_segundo as 'par' | 'impar') ?? 'par',
              },
              resultado: {
                soma: r.soma_dos_numeros as number,
                paridadeResultante: (r.paridade_resultante as 'par' | 'impar') ?? 'par',
                vencedorId: r.vencedor_id as string,
              },
            }))

          const primeiroJogador: JogadorDoReplay = {
            id: perfilPrimeiro.id_usuario as string,
            nome: perfilPrimeiro.nome as string,
            elo: (perfilPrimeiro.elo as number) ?? 1200,
            avatar: perfilPrimeiro.url_do_avatar as string | null,
          }

          const segundoJogador: JogadorDoReplay = {
            id: perfilSegundo.id_usuario as string,
            nome: perfilSegundo.nome as string,
            elo: (perfilSegundo.elo as number) ?? 1200,
            avatar: perfilSegundo.url_do_avatar as string | null,
          }

          const dadosDoReplay: DadosDoReplay = {
            partida: {
              id: idDaPartida,
              modo: partida.modo as string,
              tipo: partida.tipo as string,
              totalDeRodadas: partida.total_de_rodadas_previsto as number,
            },
            jogadores: [primeiroJogador, segundoJogador],
            rodadas: rodadasDoReplay,
            vencedorId: vencedorFinalId!,
            data: new Date().toISOString(),
          }

          await salvarReplay(idDaPartida, dadosDoReplay)
        }
      } catch (erroReplay) {
        console.error('Erro ao salvar replay:', erroReplay)
        // Não quebrar o fluxo da partida por causa do replay
      }

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
          conquistasNovas,
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
    console.error('Erro ao confirmar jogada:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao confirmar jogada.' }
  }
}
