'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import { validarJogada } from '@/core/validacao/validarJogada'
import { calcularResultadoDaRodada } from '@/core/calculo/calcularResultadoDaRodada'
import { calcularResultadoDoModoInvisivel } from '@/core/calculo/calcularResultadoDoModoInvisivel'
import { calcularElo } from '@/core/calculo/calcularElo'
import {
  INTERVALO_TRADICIONAL,
  INTERVALO_EXPANDIDO,
  gerarIntervaloDoCaos,
} from '@/core/constantes/intervalosDeNumeros'
import type { IntervaloDeNumeros } from '@/core/constantes/intervalosDeNumeros'
import { K_FACTOR_PADRAO } from '@/core/constantes/pontuacao'
import { verificarConquistas, type ConquistaNova } from '@/servidor/acoes/verificarConquistas'
import { salvarReplay } from '@/servidor/acoes/salvarReplay'
import { atribuirParidadeDaRodada, sortearParidadeInicial } from '@/core/calculo/atribuirParidade'
import type { Paridade } from '@/core/calculo/atribuirParidade'
import type { DadosDoReplay, RodadaDoReplay, JogadorDoReplay } from '@/core/tipos/replay'
import { TEMPO_LIMITE_POR_MODO_MS } from '@/core/tipos/modoDeJogo'
import type { ModoDeJogo } from '@/core/tipos/partida'
import { gerarJogadaAleatoria } from '@/core/calculo/jogadaDaIaAleatoria'

const INTERVALO_POR_MODO: Record<string, IntervaloDeNumeros> = {
  classico: INTERVALO_TRADICIONAL,
  dificil: INTERVALO_EXPANDIDO,
  relampago: INTERVALO_TRADICIONAL,
  invisivel: { minimo: 1, maximo: 10 },
  caos: { minimo: 0, maximo: 20 },
  sobrevivencia: { minimo: 1, maximo: 5 },
}

interface EntradaConfirmarJogada {
  idDaPartida: string
  numeroDaRodada: number
  numeroEscolhido: number
  tokenDeIdempotencia: string
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
  conquistasNovas?: ConquistaNova[]
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

function obterIntervaloDoModo(modo: string, rodadaId: string): IntervaloDeNumeros {
  if (modo === 'caos') {
    return gerarIntervaloDoCaos(rodadaId)
  }
  return INTERVALO_POR_MODO[modo] ?? INTERVALO_TRADICIONAL
}

function obterParidadeInicial(
  partida: Record<string, unknown>
): Paridade {
  const valorInicial = partida.paridade_inicial_do_primeiro
  return valorInicial === 'par' || valorInicial === 'impar'
    ? valorInicial
    : sortearParidadeInicial()
}

function computarParidadesDaRodada(
  numeroDaRodada: number,
  paridadeInicial: Paridade,
  totalRodadas: number
): { paridadeDoPrimeiro: Paridade; paridadeDoSegundo: Paridade } | null {
  const atribuicao = atribuirParidadeDaRodada(numeroDaRodada, paridadeInicial, totalRodadas)
  if ('desempate' in atribuicao) {
    return null
  }
  return {
    paridadeDoPrimeiro: atribuicao.paridadeDoPrimeiro,
    paridadeDoSegundo: atribuicao.paridadeDoSegundo,
  }
}

function obterParidadeComoParidade(valor: unknown): Paridade {
  return valor === 'par' || valor === 'impar' ? valor : 'par'
}

export async function confirmarJogada(
  entrada: EntradaConfirmarJogada
): Promise<ResultadoConfirmarJogada> {
  const { idDaPartida, numeroDaRodada, numeroEscolhido, tokenDeIdempotencia } =
    entrada

  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

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

    // Determinar posição do jogador
    const ehIA = partida.id_do_segundo_jogador === null

    let ehPrimeiro = false
    let ehSegundo = false

    if (ehIA) {
      if (
        partida.id_do_primeiro_jogador &&
        user &&
        partida.id_do_primeiro_jogador !== user.id
      ) {
        return { status: 'erro', mensagem: 'Você não faz parte desta partida.' }
      }
      ehPrimeiro = true
    } else {
      if (!user) {
        return { status: 'erro', mensagem: 'Usuário não autenticado.' }
      }
      ehPrimeiro = partida.id_do_primeiro_jogador === user.id
      ehSegundo = partida.id_do_segundo_jogador === user.id
      if (!ehPrimeiro && !ehSegundo) {
        return { status: 'erro', mensagem: 'Você não faz parte desta partida.' }
      }
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

    // Verificar se já jogou
    if (ehPrimeiro && rodada.jogada_do_primeiro_confirmada) {
      return { status: 'erro', mensagem: 'Você já jogou esta rodada.' }
    }
    if (ehSegundo && rodada.jogada_do_segundo_confirmada) {
      return { status: 'erro', mensagem: 'Você já jogou esta rodada.' }
    }

    // Determinar intervalo do modo
    const modo = partida.modo as string
    const intervalo = obterIntervaloDoModo(modo, rodada.id)

    // Verificar timeout server-side
    const rodadaCriadaEm = rodada.created_at
      ? new Date(rodada.created_at as string).getTime()
      : null

    const tempoLimiteMs =
      TEMPO_LIMITE_POR_MODO_MS[modo as ModoDeJogo] ?? 30_000

    const timeoutAconteceu =
      !!entrada.timeoutNoCliente ||
      (rodadaCriadaEm !== null && Date.now() - rodadaCriadaEm > tempoLimiteMs)

    // Validar jogada apenas se NÃO houve timeout
    if (!timeoutAconteceu) {
      const validacao = validarJogada({
        numeroEscolhido,
        intervalo,
        modo,
      })

      if (!validacao.valida) {
        return { status: 'erro', mensagem: validacao.erro ?? 'Jogada inválida.' }
      }

      if (!ehIA) {
        if (ehPrimeiro && !rodada.paridade_escolhida_pelo_primeiro) {
          return {
            status: 'erro',
            mensagem: 'Paridade do primeiro jogador não definida.',
          }
        }
        if (ehSegundo && !rodada.paridade_escolhida_pelo_segundo) {
          return {
            status: 'erro',
            mensagem: 'Paridade do segundo jogador não definida.',
          }
        }
      }
    }

    // Registrar jogada (ou timeout) com idempotência
    const camposAtualizar: Record<string, unknown> = {}

    if (ehPrimeiro) {
      if (timeoutAconteceu) {
        camposAtualizar.timeout_do_primeiro = true
        camposAtualizar.jogada_do_primeiro_confirmada = true
      } else {
        camposAtualizar.numero_do_primeiro_jogador = numeroEscolhido
        camposAtualizar.token_de_idempotencia_do_primeiro = tokenDeIdempotencia
        camposAtualizar.jogada_do_primeiro_confirmada = true
      }
    } else {
      if (timeoutAconteceu) {
        camposAtualizar.timeout_do_segundo = true
        camposAtualizar.jogada_do_segundo_confirmada = true
      } else {
        camposAtualizar.numero_do_segundo_jogador = numeroEscolhido
        camposAtualizar.token_de_idempotencia_do_segundo = tokenDeIdempotencia
        camposAtualizar.jogada_do_segundo_confirmada = true
      }
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
    const payloadBroadcast: Record<string, unknown> = {
      idDoJogador: user?.id ?? 'ia',
      numeroDaRodada,
    }
    if (timeoutAconteceu) {
      payloadBroadcast.timeout = true
    }
    await channel.send({
      type: 'broadcast',
      event: 'jogada_confirmada',
      payload: payloadBroadcast,
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

    // Se NÃO ambos jogaram e é modo IA, gerar jogada da IA automaticamente
    if (!ambosJogaram) {
      if (ehIA) {
        const paridadesExistentes =
          rodadaAtualizada.paridade_escolhida_pelo_primeiro &&
          rodadaAtualizada.paridade_escolhida_pelo_segundo

        if (!paridadesExistentes) {
          const totalRodadas = partida.total_de_rodadas_previsto as number
          const paridadeInicial = obterParidadeInicial(partida)
          const paridades = computarParidadesDaRodada(
            numeroDaRodada,
            paridadeInicial,
            totalRodadas
          )

          if (paridades) {
            await supabaseAdmin
              .from('rodadas')
              .update({
                paridade_escolhida_pelo_primeiro: paridades.paridadeDoPrimeiro,
                paridade_escolhida_pelo_segundo: paridades.paridadeDoSegundo,
              })
              .eq('id', rodadaAtualizada.id)
            rodadaAtualizada.paridade_escolhida_pelo_primeiro =
              paridades.paridadeDoPrimeiro
            rodadaAtualizada.paridade_escolhida_pelo_segundo =
              paridades.paridadeDoSegundo
          }
        }

        const jogadaDaIa = gerarJogadaAleatoria(intervalo)

        await supabaseAdmin
          .from('rodadas')
          .update({
            numero_do_segundo_jogador: jogadaDaIa.numero,
            jogada_do_segundo_confirmada: true,
          })
          .eq('id', rodadaAtualizada.id)

        rodadaAtualizada.numero_do_segundo_jogador = jogadaDaIa.numero
        rodadaAtualizada.jogada_do_segundo_confirmada = true
      } else {
        return {
          status: 'jogada_registrada',
          dados: { numeroDaRodada },
        }
      }
    }

    // === AMBOS JOGARAM — CALCULAR RESULTADO ===
    const timeoutPrimeiro = !!rodadaAtualizada.timeout_do_primeiro
    const timeoutSegundo = !!rodadaAtualizada.timeout_do_segundo

    let resultado: ReturnType<typeof calcularResultadoDaRodada>
    let vencedorId: string | null

    if (timeoutPrimeiro && timeoutSegundo) {
      // Ambos timeout — rodada sem vencedor (empate)
      vencedorId = null
      resultado = {
        somaDosNumeros: 0,
        paridadeResultante: 'par' as const,
        primeiroJogadorVenceu: false,
      }
    } else if (timeoutPrimeiro) {
      // Primeiro timeout → segundo vence
      vencedorId = partida.id_do_segundo_jogador as string
      resultado = {
        somaDosNumeros: 0,
        paridadeResultante: 'par' as const,
        primeiroJogadorVenceu: false,
      }
    } else if (timeoutSegundo) {
      // Segundo timeout → primeiro vence
      vencedorId = partida.id_do_primeiro_jogador as string
      resultado = {
        somaDosNumeros: 0,
        paridadeResultante: 'par' as const,
        primeiroJogadorVenceu: true,
      }
    } else {
      // Nenhum timeout — calcular resultado normal
      const numeroPrimeiro = rodadaAtualizada.numero_do_primeiro_jogador as number
      const numeroSegundo = rodadaAtualizada.numero_do_segundo_jogador as number
      const paridadePrimeiro = obterParidadeComoParidade(
        rodadaAtualizada.paridade_escolhida_pelo_primeiro
      )

      if (modo === 'invisivel') {
        const resultadoInvisivel = calcularResultadoDoModoInvisivel(
          numeroPrimeiro,
          numeroSegundo
        )
        const soma = numeroPrimeiro + numeroSegundo
        resultado = {
          somaDosNumeros: soma,
          paridadeResultante: soma % 2 === 0 ? 'par' : 'impar',
          primeiroJogadorVenceu: resultadoInvisivel.primeiroJogadorVenceu,
        }
      } else {
        resultado = calcularResultadoDaRodada(
          numeroPrimeiro,
          numeroSegundo,
          paridadePrimeiro
        )
      }

      vencedorId = resultado.primeiroJogadorVenceu
        ? partida.id_do_primeiro_jogador
        : partida.id_do_segundo_jogador
    }

    // Atualizar rodada com resultado
    await supabaseAdmin
      .from('rodadas')
      .update({
        resultado_calculado: true,
        vencedor_id: vencedorId,
        soma_dos_numeros: resultado.somaDosNumeros,
        paridade_resultante: resultado.paridadeResultante,
      })
      .eq('id', rodadaAtualizada.id)

    const dadosRodadaFinalizada: DadosDaRodadaFinalizada = {
      numeroDaRodada,
      somaDosNumeros: resultado.somaDosNumeros,
      paridadeResultante: resultado.paridadeResultante,
      vencedorId: vencedorId ?? '',
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
      pontuacaoPrimeiro >= vitoriasNecessarias ||
      pontuacaoSegundo >= vitoriasNecessarias

    if (partidaFinalizada) {
      return await finalizarPartida({
        supabaseAdmin,
        channel,
        partida,
        ehIA,
        user,
        idDaPartida,
        numeroDaRodada,
        pontuacaoPrimeiro,
        pontuacaoSegundo,
        vitoriasNecessarias,
        dadosRodadaFinalizada,
      })
    }

    // === PARTIDA CONTINUA — AVANÇAR RODADA ===
    const proximaRodada = numeroDaRodada + 1

    await supabaseAdmin
      .from('partidas')
      .update({ rodada_atual: proximaRodada })
      .eq('id', idDaPartida)

    const paridadeInicial = obterParidadeInicial(partida)
    const atribuicao = atribuirParidadeDaRodada(
      proximaRodada,
      paridadeInicial,
      totalRodadasPrevisto
    )

    if ('desempate' in atribuicao) {
      await supabaseAdmin
        .from('rodadas')
        .insert({
          id_da_partida: idDaPartida,
          numero_da_rodada: proximaRodada,
        })

      if (ehIA) {
        const paridadeDaIa: Paridade =
          Math.random() < 0.5 ? 'par' : 'impar'
        await supabaseAdmin
          .from('rodadas')
          .update({
            paridade_escolhida_pelo_primeiro:
              paridadeDaIa === 'par' ? 'impar' : 'par',
            paridade_escolhida_pelo_segundo: paridadeDaIa,
          })
          .eq('id_da_partida', idDaPartida)
          .eq('numero_da_rodada', proximaRodada)
      } else {
        const { data: rodada1 } = await supabaseAdmin
          .from('rodadas')
          .select('vencedor_id')
          .eq('id_da_partida', idDaPartida)
          .eq('numero_da_rodada', 1)
          .single()

        await channel.send({
          type: 'broadcast',
          event: 'escolher_paridade_do_desempate',
          payload: {
            idDoVencedorDaPrimeiraRodada: rodada1?.vencedor_id,
            numeroDaRodada: proximaRodada,
          },
        })
      }
    } else {
      await supabaseAdmin
        .from('rodadas')
        .insert({
          id_da_partida: idDaPartida,
          numero_da_rodada: proximaRodada,
          paridade_escolhida_pelo_primeiro: atribuicao.paridadeDoPrimeiro,
          paridade_escolhida_pelo_segundo: atribuicao.paridadeDoSegundo,
        })
    }

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

interface ParametrosFinalizarPartida {
  supabaseAdmin: ReturnType<typeof criarClienteServidorAdmin>
  channel: ReturnType<ReturnType<typeof criarClienteServidorAdmin>['channel']>
  partida: Record<string, unknown>
  ehIA: boolean
  user: { id: string } | null
  idDaPartida: string
  numeroDaRodada: number
  pontuacaoPrimeiro: number
  pontuacaoSegundo: number
  vitoriasNecessarias: number
  dadosRodadaFinalizada: DadosDaRodadaFinalizada
}

async function finalizarPartida(
  params: ParametrosFinalizarPartida
): Promise<ResultadoConfirmarJogada> {
  const {
    supabaseAdmin,
    channel,
    partida,
    ehIA,
    user,
    idDaPartida,
    numeroDaRodada,
    pontuacaoPrimeiro,
    pontuacaoSegundo,
    vitoriasNecessarias,
    dadosRodadaFinalizada,
  } = params

  const vencedorFinalId = (
    pontuacaoPrimeiro >= vitoriasNecessarias
      ? partida.id_do_primeiro_jogador
      : partida.id_do_segundo_jogador
  ) as string | null

  const perdedorFinalId = (
    vencedorFinalId === partida.id_do_primeiro_jogador
      ? partida.id_do_segundo_jogador
      : partida.id_do_primeiro_jogador
  ) as string | null

  // Atualizar partida
  await supabaseAdmin
    .from('partidas')
    .update({
      status: 'finalizada',
      vencedor_id: vencedorFinalId,
      rodada_atual: numeroDaRodada,
    })
    .eq('id', idDaPartida)

  let eloGanho = 0
  let eloPerdido = 0
  let novoEloVencedor = 0
  let novoEloPerdedor = 0
  let conquistasNovas: ConquistaNova[] = []

  // PvP: calcular Elo, atualizar perfis, verificar conquistas, salvar replay
  if (!ehIA && user && vencedorFinalId && perdedorFinalId) {
    const resultadoElos = await processarEloEAchievements(
      supabaseAdmin,
      vencedorFinalId,
      perdedorFinalId
    )
    eloGanho = resultadoElos.eloGanho
    eloPerdido = resultadoElos.eloPerdido
    novoEloVencedor = resultadoElos.novoEloVencedor
    novoEloPerdedor = resultadoElos.novoEloPerdedor
    conquistasNovas = resultadoElos.conquistasNovas

    await salvarReplayDaPartida(
      supabaseAdmin,
      idDaPartida,
      partida,
      vencedorFinalId
    )
  }

  // Limpar dados se anônimo
  if (!user) {
    await supabaseAdmin.from('rodadas').delete().eq('id_da_partida', idDaPartida)
    await supabaseAdmin.from('partidas').delete().eq('id', idDaPartida)
  }

  // Broadcast fim da partida
  await channel.send({
    type: 'broadcast',
    event: 'fim_da_partida',
    payload: {
      vencedorId: vencedorFinalId,
      eloGanho,
      eloPerdido,
      novoEloVencedor,
      novoEloPerdedor,
      pontuacaoPrimeiro,
      pontuacaoSegundo,
      conquistasNovas,
    },
  })

  return {
    status: 'partida_finalizada',
    dados: dadosRodadaFinalizada,
    partidaFinalizada: true,
    resultado: {
      vencedorId: vencedorFinalId!,
      eloGanho,
      eloPerdido,
      novoEloVencedor,
      novoEloPerdedor,
      pontuacaoPrimeiro,
      pontuacaoSegundo,
      conquistasNovas:
        conquistasNovas.length > 0 ? conquistasNovas : undefined,
    },
  }
}

interface ResultadoProcessarElo {
  eloGanho: number
  eloPerdido: number
  novoEloVencedor: number
  novoEloPerdedor: number
  conquistasNovas: ConquistaNova[]
}

async function processarEloEAchievements(
  supabaseAdmin: ReturnType<typeof criarClienteServidorAdmin>,
  vencedorId: string,
  perdedorId: string
): Promise<ResultadoProcessarElo> {
  const { data: perfilVencedor } = await supabaseAdmin
    .from('perfis')
    .select('elo, total_de_vitorias, total_de_partidas, sequencia_atual')
    .eq('id_usuario', vencedorId)
    .single()

  const { data: perfilPerdedor } = await supabaseAdmin
    .from('perfis')
    .select('elo, total_de_derrotas, total_de_partidas, sequencia_atual')
    .eq('id_usuario', perdedorId)
    .single()

  const eloVencedor = (perfilVencedor?.elo as number) ?? 1200
  const eloPerdedor = (perfilPerdedor?.elo as number) ?? 1200

  const { novoEloDoVencedor, novoEloDoPerdedor } = calcularElo(
    eloVencedor,
    eloPerdedor,
    K_FACTOR_PADRAO
  )

  await supabaseAdmin
    .from('perfis')
    .update({
      elo: novoEloDoVencedor,
      total_de_vitorias:
        ((perfilVencedor?.total_de_vitorias as number) ?? 0) + 1,
      total_de_partidas:
        ((perfilVencedor?.total_de_partidas as number) ?? 0) + 1,
      sequencia_atual:
        ((perfilVencedor?.sequencia_atual as number) ?? 0) + 1,
    })
    .eq('id_usuario', vencedorId)

  await supabaseAdmin
    .from('perfis')
    .update({
      elo: novoEloDoPerdedor,
      total_de_derrotas:
        ((perfilPerdedor?.total_de_derrotas as number) ?? 0) + 1,
      total_de_partidas:
        ((perfilPerdedor?.total_de_partidas as number) ?? 0) + 1,
      sequencia_atual: 0,
    })
    .eq('id_usuario', perdedorId)

  const resultadoConquistas = await verificarConquistas(vencedorId)

  return {
    eloGanho: novoEloDoVencedor - eloVencedor,
    eloPerdido: eloPerdedor - novoEloDoPerdedor,
    novoEloVencedor: novoEloDoVencedor,
    novoEloPerdedor: novoEloDoPerdedor,
    conquistasNovas: resultadoConquistas.conquistasNovas,
  }
}

async function salvarReplayDaPartida(
  supabaseAdmin: ReturnType<typeof criarClienteServidorAdmin>,
  idDaPartida: string,
  partida: Record<string, unknown>,
  vencedorId: string
): Promise<void> {
  try {
    const { data: rodadasCompletas } = await supabaseAdmin
      .from('rodadas')
      .select(
        'numero_da_rodada, numero_do_primeiro_jogador, paridade_escolhida_pelo_primeiro, numero_do_segundo_jogador, paridade_escolhida_pelo_segundo, vencedor_id, soma_dos_numeros, paridade_resultante'
      )
      .eq('id_da_partida', idDaPartida)
      .eq('resultado_calculado', true)

    if (!rodadasCompletas || rodadasCompletas.length === 0) {
      return
    }

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

    if (!perfilPrimeiro || !perfilSegundo) {
      return
    }

    const rodadasDoReplay: RodadaDoReplay[] = rodadasCompletas
      .filter(
        (r) =>
          r.numero_do_primeiro_jogador != null &&
          r.numero_do_segundo_jogador != null
      )
      .map((r) => ({
        numero: r.numero_da_rodada as number,
        jogadaPrimeiro: {
          numero: r.numero_do_primeiro_jogador as number,
          paridade: obterParidadeComoParidade(
            r.paridade_escolhida_pelo_primeiro
          ),
        },
        jogadaSegundo: {
          numero: r.numero_do_segundo_jogador as number,
          paridade: obterParidadeComoParidade(
            r.paridade_escolhida_pelo_segundo
          ),
        },
        resultado: {
          soma: r.soma_dos_numeros as number,
          paridadeResultante: obterParidadeComoParidade(
            r.paridade_resultante
          ),
          vencedorId: r.vencedor_id as string,
        },
      }))

    const primeiroJogador: JogadorDoReplay = {
      id: perfilPrimeiro.id_usuario as string,
      nome: perfilPrimeiro.nome as string,
      elo: (perfilPrimeiro.elo as number) ?? 1200,
      avatar: (perfilPrimeiro.url_do_avatar as string | null) ?? null,
    }

    const segundoJogador: JogadorDoReplay = {
      id: perfilSegundo.id_usuario as string,
      nome: perfilSegundo.nome as string,
      elo: (perfilSegundo.elo as number) ?? 1200,
      avatar: (perfilSegundo.url_do_avatar as string | null) ?? null,
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
      vencedorId: vencedorId,
      data: new Date().toISOString(),
    }

    await salvarReplay(idDaPartida, dadosDoReplay)
  } catch (erroReplay) {
    console.error('Erro ao salvar replay:', erroReplay)
  }
}
