'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import { calcularFrequenciaDosNumeros } from '@/core/calculo/calcularEstatisticasDoJogador'

interface EntradaBuscarEstatisticas {
  idDaPartida: string
  idDoOponente: string
}

export interface EstatisticasDoAdversario {
  frequenciaDosNumeros: Record<number, number>
  numeroMaisUsado: number | null
  frequenciaDePares: number
  frequenciaDeImpares: number
  sequenciaAtual: number[]
  taxaDeRepeticao: number
}

export async function buscarEstatisticasDoAdversario(
  entrada: EntradaBuscarEstatisticas
): Promise<EstatisticasDoAdversario | { erro: string }> {
  const { idDaPartida, idDoOponente } = entrada

  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { erro: 'Usuário não autenticado.' }
    }

    const supabaseAdmin = criarClienteServidorAdmin()

    // Buscar partida para confirmar que o usuário participa dela
    const { data: partida } = await supabaseAdmin
      .from('partidas')
      .select('id_do_primeiro_jogador, id_do_segundo_jogador')
      .eq('id', idDaPartida)
      .single()

    if (!partida) {
      return { erro: 'Partida não encontrada.' }
    }

    const usuarioParticipa =
      partida.id_do_primeiro_jogador === user.id ||
      partida.id_do_segundo_jogador === user.id

    if (!usuarioParticipa) {
      return { erro: 'Você não participa desta partida.' }
    }

    // Buscar todas as rodadas finalizadas da partida
    const { data: rodadas } = await supabaseAdmin
      .from('rodadas')
      .select(
        'numero_da_rodada, numero_do_primeiro_jogador, numero_do_segundo_jogador, resultado_calculado'
      )
      .eq('id_da_partida', idDaPartida)
      .eq('resultado_calculado', true)
      .order('numero_da_rodada', { ascending: true })

    if (!rodadas || rodadas.length === 0) {
      return {
        frequenciaDosNumeros: {},
        numeroMaisUsado: null,
        frequenciaDePares: 0,
        frequenciaDeImpares: 0,
        sequenciaAtual: [],
        taxaDeRepeticao: 0,
      }
    }

    // Extrair números do oponente
    const ehOponentePrimeiro = partida.id_do_primeiro_jogador === idDoOponente
    const historicoDoOponente = rodadas.map((rodada) => {
      const numero = ehOponentePrimeiro
        ? (rodada.numero_do_primeiro_jogador as number)
        : (rodada.numero_do_segundo_jogador as number)

      return {
        numero,
        paridade: numero % 2 === 0 ? 'par' : 'impar',
      }
    })

    // Calcular frequência dos números
    const frequenciaDosNumeros = calcularFrequenciaDosNumeros(historicoDoOponente)

    // Número mais utilizado
    let numeroMaisUsado: number | null = null
    let maiorFrequencia = 0

    for (const [numeroStr, frequencia] of Object.entries(frequenciaDosNumeros)) {
      if ((frequencia as number) > maiorFrequencia) {
        maiorFrequencia = frequencia as number
        numeroMaisUsado = Number(numeroStr)
      }
    }

    // Frequência de pares e ímpares
    const totalDeJogadas = historicoDoOponente.length
    let totalDePares = 0

    for (const jogada of historicoDoOponente) {
      if (jogada.numero % 2 === 0) {
        totalDePares++
      }
    }

    const frequenciaDePares = totalDeJogadas > 0 ? totalDePares / totalDeJogadas : 0
    const frequenciaDeImpares = totalDeJogadas > 0
      ? (totalDeJogadas - totalDePares) / totalDeJogadas
      : 0

    // Sequência atual: últimos 5 números
    const ultimosNumeros = historicoDoOponente
      .slice(-5)
      .map((jogada) => jogada.numero)

    // Taxa de repetição: quantas vezes o jogador repetiu o número da rodada anterior
    let repeticoes = 0
    for (let i = 1; i < historicoDoOponente.length; i++) {
      if (historicoDoOponente[i]!.numero === historicoDoOponente[i - 1]!.numero) {
        repeticoes++
      }
    }
    const taxaDeRepeticao =
      totalDeJogadas > 1 ? repeticoes / (totalDeJogadas - 1) : 0

    return {
      frequenciaDosNumeros,
      numeroMaisUsado,
      frequenciaDePares,
      frequenciaDeImpares,
      sequenciaAtual: ultimosNumeros,
      taxaDeRepeticao,
    }
  } catch (erro) {
    console.error('Erro ao buscar estatísticas do adversário:', erro)
    return { erro: 'Erro inesperado ao buscar estatísticas.' }
  }
}
