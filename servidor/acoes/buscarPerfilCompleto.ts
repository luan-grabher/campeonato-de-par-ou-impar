'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import type { PerfilDoJogador, EstatisticasDoJogador } from '@/core/tipos/jogador'
import { calcularEstatisticasDoJogador } from '@/core/calculo/calcularEstatisticasDoJogador'

export interface HistoricoRecente {
  id: string
  modo: string
  resultado: 'vitoria' | 'derrota' | 'empate'
  adversario: string
  createdAt: string
}

export interface PerfilCompleto {
  perfil: PerfilDoJogador
  estatisticas: EstatisticasDoJogador
  historicoRecente: HistoricoRecente[]
  campeonatosVencidos: number
  numeroFavorito: number | null
  numeroMenosUsado: number | null
}

export async function buscarPerfilCompleto(): Promise<PerfilCompleto | { erro: string }> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { erro: 'Usuário não autenticado.' }
    }

    // Buscar perfil
    const { data: perfil, error: erroPerfil } = await supabase
      .from('perfis')
      .select('*')
      .eq('id_usuario', user.id)
      .single()

    if (erroPerfil || !perfil) {
      return { erro: 'Perfil não encontrado.' }
    }

    const perfilDoJogador: PerfilDoJogador = {
      id: perfil.id_usuario as string,
      nome: perfil.nome as string,
      email: user.email ?? null,
      pais: perfil.pais as string | null,
      urlDoAvatar: perfil.url_do_avatar as string | null,
      elo: perfil.elo as number,
      totalDeVitorias: perfil.total_de_vitorias as number,
      totalDeDerrotas: perfil.total_de_derrotas as number,
      totalDePartidas: perfil.total_de_partidas as number,
      sequenciaAtual: perfil.sequencia_atual as number,
      maiorSequencia: perfil.maior_sequencia as number,
      numeroFavorito: perfil.numero_favorito as number | null,
      moedas: perfil.moedas as number,
    }

    // Buscar partidas recentes finalizadas
    const { data: partidas } = await supabase
      .from('partidas')
      .select('id, modo, vencedor_id, created_at, id_do_primeiro_jogador, id_do_segundo_jogador')
      .or(
        `id_do_primeiro_jogador.eq.${user.id},id_do_segundo_jogador.eq.${user.id}`
      )
      .eq('status', 'finalizada')
      .order('created_at', { ascending: false })
      .limit(10)

    const historicoRecente: HistoricoRecente[] = []
    const idsDosAdversarios = new Set<string>()
    const idsDasPartidasRecentes: string[] = []

    if (partidas && partidas.length > 0) {
      // Coletar IDs de adversários e partidas
      for (const partida of partidas) {
        idsDasPartidasRecentes.push(partida.id as string)

        const idDoAdversario =
          partida.id_do_primeiro_jogador === user.id
            ? partida.id_do_segundo_jogador
            : partida.id_do_primeiro_jogador

        if (idDoAdversario) {
          idsDosAdversarios.add(idDoAdversario as string)
        }
      }

      // Buscar nomes dos adversários
      const { data: perfisAdversarios } = await supabase
        .from('perfis')
        .select('id_usuario, nome')
        .in('id_usuario', Array.from(idsDosAdversarios))

      const mapaDeNomes = new Map<string, string>()
      if (perfisAdversarios) {
        for (const p of perfisAdversarios) {
          mapaDeNomes.set(p.id_usuario as string, p.nome as string)
        }
      }

      // Montar histórico recente
      for (const partida of partidas) {
        const idDoAdversario =
          partida.id_do_primeiro_jogador === user.id
            ? partida.id_do_segundo_jogador
            : partida.id_do_primeiro_jogador

        let resultado: 'vitoria' | 'derrota' | 'empate' = 'empate'
        if (partida.vencedor_id === user.id) {
          resultado = 'vitoria'
        } else if (partida.vencedor_id && partida.vencedor_id !== user.id) {
          resultado = 'derrota'
        }

        historicoRecente.push({
          id: partida.id as string,
          modo: partida.modo as string,
          resultado,
          adversario: mapaDeNomes.get(idDoAdversario as string) ?? 'Desconhecido',
          createdAt: partida.created_at as string,
        })
      }

      // Buscar rodadas das partidas recentes para calcular estatísticas
      if (idsDasPartidasRecentes.length > 0) {
        const { data: rodadas } = await supabase
          .from('rodadas')
          .select('*')
          .in('id_da_partida', idsDasPartidasRecentes)
          .order('numero_da_rodada', { ascending: true })

        const historicoDoJogador: { numero: number; paridade: string }[] = []

        if (rodadas) {
          for (const rodada of rodadas) {
            // Determinar qual número é do usuário nesta rodada
            const partidaDaRodada = partidas.find(
              (p) => p.id === rodada.id_da_partida
            )

            if (!partidaDaRodada) continue

            const usuarioEhPrimeiro =
              partidaDaRodada.id_do_primeiro_jogador === user.id

            const numero =
              usuarioEhPrimeiro && rodada.jogada_do_primeiro_confirmada
                ? rodada.numero_do_primeiro_jogador
                : !usuarioEhPrimeiro && rodada.jogada_do_segundo_confirmada
                  ? rodada.numero_do_segundo_jogador
                  : null

            if (numero !== null && typeof numero === 'number') {
              historicoDoJogador.push({
                numero,
                paridade: numero % 2 === 0 ? 'par' : 'impar',
              })
            }
          }
        }

        // Calcular estatísticas com o histórico real
        const estatisticasCalculadas = calcularEstatisticasDoJogador(
          perfilDoJogador,
          historicoDoJogador
        )

        // Calcular número favorito e menos usado
        const frequencia = estatisticasCalculadas.frequenciaDosNumeros
        let numeroFavorito: number | null = null
        let numeroMenosUsado: number | null = null

        const entradas = Object.entries(frequencia) as [string, number][]
        if (entradas.length > 0) {
          let maxFreq = 0
          let minFreq = Infinity

          for (const [numStr, freq] of entradas) {
            const num = Number(numStr)
            if (freq > maxFreq) {
              maxFreq = freq
              numeroFavorito = num
            }
            if (freq < minFreq) {
              minFreq = freq
              numeroMenosUsado = num
            }
          }
        }

        // Buscar campeonatos vencidos
        const { data: campeonatosVencidos } = await supabase
          .from('participantes_do_campeonato')
          .select('id_do_campeonato', { count: 'exact', head: true })
          .eq('id_do_jogador', user.id)
          .eq('posicao_final', 1)

        const totalCampeonatosVencidos =
          campeonatosVencidos?.length ?? 0

        return {
          perfil: perfilDoJogador,
          estatisticas: estatisticasCalculadas,
          historicoRecente,
          campeonatosVencidos: totalCampeonatosVencidos,
          numeroFavorito,
          numeroMenosUsado,
        }
      }
    }

    // Sem partidas recentes — retornar estatísticas vazias
    const estatisticasVazias = calcularEstatisticasDoJogador(perfilDoJogador, [])

    return {
      perfil: perfilDoJogador,
      estatisticas: estatisticasVazias,
      historicoRecente: [],
      campeonatosVencidos: 0,
      numeroFavorito: null,
      numeroMenosUsado: null,
    }
  } catch (erro) {
    console.error('Erro ao buscar perfil completo:', erro)
    return { erro: 'Erro inesperado ao buscar perfil.' }
  }
}
