'use server'

import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import { obterFaixaDeElo } from '@/supabase/tipos.gen'

interface JogadorNoRanking {
  posicao: number
  id: string
  nome: string
  elo: number
  faixa: string
  totalDeVitorias: number
  totalDePartidas: number
}

export interface ResultadoCalcularRecompensas {
  sucesso: boolean
  ranking: JogadorNoRanking[]
  totalDeJogadores: number
  erro?: string
}

/**
 * Calcula o ranking final dos jogadores para uma temporada.
 * Retorna a lista ordenada por Elo (decrescente) com posições.
 */
export async function calcularRecompensasDaTemporada(
  _idDaTemporada: string
): Promise<ResultadoCalcularRecompensas> {
  try {
    const supabaseAdmin = criarClienteServidorAdmin()

    const { data: perfis, error } = await supabaseAdmin
      .from('perfis')
      .select('id_usuario, nome, elo, total_de_vitorias, total_de_partidas')
      .order('elo', { ascending: false })

    if (error) {
      console.error('Erro ao buscar perfis para recompensas:', error)
      return { sucesso: false, ranking: [], totalDeJogadores: 0, erro: 'Erro ao buscar ranking.' }
    }

    if (!perfis || perfis.length === 0) {
      return { sucesso: true, ranking: [], totalDeJogadores: 0 }
    }

    const total = perfis.length
    const ranking: JogadorNoRanking[] = perfis.map((perfil, index) => {
      const elo = perfil.elo as number
      const faixa = obterFaixaDeElo(elo)

      return {
        posicao: index + 1,
        id: perfil.id_usuario as string,
        nome: perfil.nome as string,
        elo,
        faixa: faixa.nome,
        totalDeVitorias: perfil.total_de_vitorias as number,
        totalDePartidas: perfil.total_de_partidas as number,
      }
    })

    return {
      sucesso: true,
      ranking,
      totalDeJogadores: total,
    }
  } catch (erro) {
    console.error('Erro inesperado ao calcular recompensas:', erro)
    return { sucesso: false, ranking: [], totalDeJogadores: 0, erro: 'Erro inesperado ao calcular recompensas.' }
  }
}
