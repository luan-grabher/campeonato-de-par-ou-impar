'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import { calcularRecompensasDaTemporada } from '@/servidor/acoes/calcularRecompensasDaTemporada'
import type { Temporada } from '@/supabase/tipos.gen'

export interface ResultadoFinalizarTemporada {
  sucesso: boolean
  temporada: Temporada | null
  recompensasDistribuidas: number
  erro?: string
}

/**
 * Finaliza a temporada ativa: define status como 'finalizada', atualiza
 * data_de_fim para o momento atual, e distribui recompensas baseadas
 * no ranking final.
 */
export async function finalizarTemporada(): Promise<ResultadoFinalizarTemporada> {
  try {
    const supabase = await criarClienteServidor()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, temporada: null, recompensasDistribuidas: 0, erro: 'Usuário não autenticado.' }
    }

    const supabaseAdmin = criarClienteServidorAdmin()

    // Buscar temporada ativa
    const { data: temporadaAtiva } = await supabaseAdmin
      .from('temporadas')
      .select('*')
      .eq('status', 'ativa')
      .limit(1)
      .maybeSingle()

    if (!temporadaAtiva) {
      return { sucesso: false, temporada: null, recompensasDistribuidas: 0, erro: 'Nenhuma temporada ativa para finalizar.' }
    }

    // Calcular recompensas baseadas no ranking final
    const resultadoRecompensas = await calcularRecompensasDaTemporada(temporadaAtiva.id)

    if (!resultadoRecompensas.sucesso) {
      return {
        sucesso: false,
        temporada: null,
        recompensasDistribuidas: 0,
        erro: resultadoRecompensas.erro ?? 'Erro ao calcular recompensas.',
      }
    }

    // Finalizar a temporada
    const { data, error } = await supabaseAdmin
      .from('temporadas')
      .update({
        status: 'finalizada',
        data_de_fim: new Date().toISOString(),
      })
      .eq('id', temporadaAtiva.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao finalizar temporada:', error)
      return { sucesso: false, temporada: null, recompensasDistribuidas: 0, erro: 'Erro ao finalizar temporada.' }
    }

    return {
      sucesso: true,
      temporada: data,
      recompensasDistribuidas: resultadoRecompensas.totalDeJogadores,
    }
  } catch (erro) {
    console.error('Erro inesperado ao finalizar temporada:', erro)
    return { sucesso: false, temporada: null, recompensasDistribuidas: 0, erro: 'Erro inesperado ao finalizar temporada.' }
  }
}
