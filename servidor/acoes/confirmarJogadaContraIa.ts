'use server'

import { buscarPartida, atualizarPartida } from '../partidaContraIaStore'
import { validarJogada } from '../../core/validacao/validarJogada'
import { gerarJogadaAleatoria } from '../../core/calculo/jogadaDaIaAleatoria'
import { calcularResultadoDaRodada } from '../../core/calculo/calcularResultadoDaRodada'
import { INTERVALO_EXPANDIDO } from '../../core/constantes/intervalosDeNumeros'
import type { ResultadoDaRodada } from '../../core/tipos/rodada'

export interface ConfirmarJogadaParams {
  idDaPartida: string
  numeroDaRodada: number
  numeroEscolhido: number
  paridadeEscolhida: 'par' | 'impar'
}

export interface ResultadoDaRodadaConfirmada {
  numeroDaRodada: number
  numeroDoJogador: number
  paridadeDoJogador: 'par' | 'impar'
  numeroDaIa: number
  paridadeDaIa: 'par' | 'impar'
  resultado: ResultadoDaRodada
  pontuacaoDoJogador: number
  pontuacaoDaIa: number
  partidaFinalizada: boolean
  vencedor: 'jogador' | 'ia' | null
}

export async function confirmarJogadaContraIa(
  params: ConfirmarJogadaParams
): Promise<ResultadoDaRodadaConfirmada> {
  const { idDaPartida, numeroDaRodada, numeroEscolhido, paridadeEscolhida } =
    params

  // 1. Buscar partida
  const partida = buscarPartida(idDaPartida)
  if (!partida) {
    throw new Error('Partida não encontrada ou expirada.')
  }

  if (partida.finalizada) {
    throw new Error('Partida já foi finalizada.')
  }

  if (partida.rodadaAtual !== numeroDaRodada) {
    throw new Error(
      `Rodada inválida. Esperada rodada ${partida.rodadaAtual}, recebida ${numeroDaRodada}.`
    )
  }

  // 2. Validar jogada do jogador
  const validacao = validarJogada({
    numeroEscolhido,
    intervalo: INTERVALO_EXPANDIDO,
    modo: 'classico',
  })

  if (!validacao.valida) {
    throw new Error(validacao.erro ?? 'Jogada inválida.')
  }

  if (!['par', 'impar'].includes(paridadeEscolhida)) {
    throw new Error('Paridade inválida.')
  }

  // 3. Encontrar rodada atual
  const rodada = partida.rodadas[numeroDaRodada - 1]
  if (!rodada) {
    throw new Error('Rodada não encontrada.')
  }

  if (rodada.confirmada) {
    throw new Error('Rodada já foi confirmada.')
  }

  // 4. Gerar jogada da IA (Aleatória)
  const jogadaDaIa = gerarJogadaAleatoria(INTERVALO_EXPANDIDO)

  // 5. Calcular resultado
  const resultado = calcularResultadoDaRodada(
    numeroEscolhido,
    jogadaDaIa.numero,
    paridadeEscolhida
  )

  // 6. Atualizar placar
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

  // 7. Salvar estado atualizado
  const rodadasAtualizadas = [...partida.rodadas]
  rodadasAtualizadas[numeroDaRodada - 1] = {
    ...rodada,
    numeroDoJogador: numeroEscolhido,
    paridadeDoJogador: paridadeEscolhida,
    numeroDaIa: jogadaDaIa.numero,
    paridadeDaIa: jogadaDaIa.paridade,
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

  // 8. Retornar resultado da rodada
  return {
    numeroDaRodada,
    numeroDoJogador: numeroEscolhido,
    paridadeDoJogador: paridadeEscolhida,
    numeroDaIa: jogadaDaIa.numero,
    paridadeDaIa: jogadaDaIa.paridade,
    resultado,
    pontuacaoDoJogador: novaPontuacaoJogador,
    pontuacaoDaIa: novaPontuacaoIa,
    partidaFinalizada,
    vencedor,
  }
}
