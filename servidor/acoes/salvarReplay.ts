'use server'

import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import type { DadosDoReplay } from '@/core/tipos/replay'

export type ResultadoSalvarReplay =
  | { sucesso: true; id: string }
  | { sucesso: false; erro: string }

export async function salvarReplay(
  idDaPartida: string,
  dados: DadosDoReplay
): Promise<ResultadoSalvarReplay> {
  try {
    const supabaseAdmin = criarClienteServidorAdmin()

    const { data, error } = await supabaseAdmin
      .from('replays')
      .insert({
        id_da_partida: idDaPartida,
        dados_json: dados as unknown as Record<string, unknown>,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Erro ao salvar replay:', error)
      return { sucesso: false, erro: 'Erro ao salvar replay.' }
    }

    return { sucesso: true, id: data.id as string }
  } catch (erro) {
    console.error('Erro inesperado ao salvar replay:', erro)
    return { sucesso: false, erro: 'Erro inesperado ao salvar replay.' }
  }
}
