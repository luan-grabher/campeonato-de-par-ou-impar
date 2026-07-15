'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import type { Temporada } from '@/supabase/tipos.gen'

export interface ResultadoBuscarTemporadaAtual {
  sucesso: boolean
  temporada: Temporada | null
  erro?: string
}

/**
 * Busca a temporada ativa no momento (status = 'ativa' e data atual dentro do período).
 * Retorna null se não houver temporada ativa.
 */
export async function buscarTemporadaAtual(): Promise<ResultadoBuscarTemporadaAtual> {
  try {
    const supabase = await criarClienteServidor()

    const { data, error } = await supabase
      .from('temporadas')
      .select('*')
      .eq('status', 'ativa')
      .lte('data_de_inicio', new Date().toISOString())
      .gte('data_de_fim', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar temporada atual:', error)
      return { sucesso: false, temporada: null, erro: 'Erro ao buscar temporada atual.' }
    }

    return { sucesso: true, temporada: data }
  } catch (erro) {
    console.error('Erro inesperado ao buscar temporada atual:', erro)
    return { sucesso: false, temporada: null, erro: 'Erro inesperado ao buscar temporada atual.' }
  }
}
