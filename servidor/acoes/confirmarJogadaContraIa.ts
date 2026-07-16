'use server'

import { buscarPartida, atualizarPartida } from '../partidaContraIaStore'
import { validarJogada } from '../../core/validacao/validarJogada'
import { gerarJogadaAleatoria } from '../../core/calculo/jogadaDaIaAleatoria'
import { calcularResultadoDaRodada } from '../../core/calculo/calcularResultadoDaRodada'
import { atribuirParidadeDaRodada } from '../../core/calculo/atribuirParidade'
import { INTERVALO_EXPANDIDO } from '../../core/constantes/intervalosDeNumeros'
import type { ResultadoDaRodada } from '../../core/tipos/rodada'

export interface ConfirmarJogadaParams {
  idDaPartida: string
  numeroDaRodada: number
  numeroEscolhido: number
}

export interface ResultadoDaRodadaConfirmada {
  numeroDaRodada: number
  numeroDoJogador: number
  paridadeDoJogador: 'par' | 'impar' | null
  numeroDaIa: number | null
  paridadeDaIa: 'par' | 'impar' | null
  resultado: ResultadoDaRodada | null
  pontuacaoDoJogador: number
  pontuacaoDaIa: number
  partidaFinalizada: boolean
  vencedor: 'jogador' | 'ia' | null
  desempate?: true
}

export async function confirmarJogadaContraIa(
  params: ConfirmarJogadaParams
): Promise<ResultadoDaRodadaConfirmada> {
  const { idDaPartida, numeroDaRodada, numeroEscolhido } = params

  const partida = buscarPartida(idDaPartida)
  if (!partida) {
    throw new Error('Partida n\u00e3o encontrada ou expirada.')
  }

  if (partida.finalizada) {
    throw new Error('Partida j\u00e1 foi finalizada.')
  }

  if (partida.rodadaAtual !== numeroDaRodada) {
    throw new Error(
      'Rodada inv\u00e1lida. Esperada rodada ' + partida.rodadaAtual + ', recebida ' + numeroDaRodada + '.'
    )
  }

  const validacao = validarJogada({
    numeroEscolhido,
    intervalo: INTERVALO_EXPANDIDO,
    modo: 'classico',
  })

  if (!validacao.valida) {
    throw new Error(validacao.erro ?? 'Jogada inv\u00e1lida.')
  }

  const rodada = partida.rodadas[numeroDaRodada - 1]
  if (!rodada) {
    throw new Error('Rodada n\u00e3o encontrada.')
  }

  if (rodada.confirmada) {
    throw new Error('Rodada j\u00e1 foi confirmada.')
  }

  const atribuicao = atribuirParidadeDaRodada(
    numeroDaRodada,
    partida.paridadeInicialDoPrimeiro,
    partida.totalDeRodadas
  )

  let paridadeDoJogador: 'par' | 'impar'
  let paridadeDaIa: 'par' | 'impar'

  if ('desempate' in atribuicao) {
    const primeiraRodada = partida.rodadas[0]
    if (!primeiraRodada?.resultado) {
      throw new Error(
        'Resultado da primeira rodada n\u00e3o encontrado para desempate.'
      )
    }

    if (primeiraRodada.resultado.primeiroJogadorVenceu) {
      const rodadasAtualizadas = [...partida.rodadas]
      rodadasAtualizadas[numeroDaRodada - 1] = {
        ...rodada,
        numeroDoJogador: numeroEscolhido,
      }

      atualizarPartida(idDaPartida, {
        rodadas: rodadasAtualizadas,
      })

      return {
        numeroDaRodada,
        numeroDoJogador: numeroEscolhido,
        paridadeDoJogador: null,
        numeroDaIa: null,
        paridadeDaIa: null,
        resultado: null,
        pontuacaoDoJogador: partida.pontuacaoDoJogador,
        pontuacaoDaIa: partida.pontuacaoDaIa,
        partidaFinalizada: false,
        vencedor: null,
        desempate: true,
      }
    }

    paridadeDaIa = Math.random() < 0.5 ? 'par' : 'impar'
    paridadeDoJogador = paridadeDaIa === 'par' ? 'impar' : 'par'
  } else {
    paridadeDoJogador = atribuicao.paridadeDoPrimeiro
    paridadeDaIa = atribuicao.paridadeDoSegundo
  }

  const jogadaDaIa = gerarJogadaAleatoria(INTERVALO_EXPANDIDO)

  const resultado = calcularResultadoDaRodada(
    numeroEscolhido,
    jogadaDaIa.numero,
    paridadeDoJogador
  )

  const novaPontuacaoJogador = resultado.primeiroJogadorVenceu
    ? partida.pontuacaoDoJogador + 1
    : partida.pontuacaoDoJogador
  const novaPontuacaoIa = !resultado.primeiroJogadorVenceu
    ? partida.pontuacaoDaIa + 1
    : partida.pontuacaoDaIa

  const proximaRodada = numeroDaRodada + 1
  const partidaFinalizada = proximaRodada > partida.totalDeRodadas

  let vencedor: 'jogador' | 'ia' | null = null
  if (partidaFinalizada) {
    if (novaPontuacaoJogador > novaPontuacaoIa) {
      vencedor = 'jogador'
    } else if (novaPontuacaoIa > novaPontuacaoJogador) {
      vencedor = 'ia'
    }
  }

  const rodadasAtualizadas = [...partida.rodadas]
  rodadasAtualizadas[numeroDaRodada - 1] = {
    ...rodada,
    numeroDoJogador: numeroEscolhido,
    paridadeDoJogador,
    numeroDaIa: jogadaDaIa.numero,
    paridadeDaIa,
    resultado,
    confirmada: true,
  }

  atualizarPartida(idDaPartida, {
    rodadaAtual: partidaFinalizada ? partida.rodadaAtual : proximaRodada,
    rodadas: rodadasAtualizadas,
    finalizada: partidaFinalizada,
    vencedor,
    pontuacaoDoJogador: novaPontuacaoJogador,
    pontuacaoDaIa: novaPontuacaoIa,
  })

  return {
    numeroDaRodada,
    numeroDoJogador: numeroEscolhido,
    paridadeDoJogador,
    numeroDaIa: jogadaDaIa.numero,
    paridadeDaIa,
    resultado,
    pontuacaoDoJogador: novaPontuacaoJogador,
    pontuacaoDaIa: novaPontuacaoIa,
    partidaFinalizada,
    vencedor,
  }
}
