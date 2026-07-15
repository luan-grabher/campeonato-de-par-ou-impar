'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import type { DadosDoReplay } from '@/core/tipos/replay'

export type ResultadoBuscarReplay =
  | { sucesso: true; replay: DadosDoReplay }
  | { sucesso: false; erro: string; naoEncontrado?: boolean }

export async function buscarReplayDaPartida(
  idDaPartida: string
): Promise<ResultadoBuscarReplay> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, erro: 'Usuário não autenticado.' }
    }

    const { data, error } = await supabase
      .from('replays')
      .select('dados_json, created_at')
      .eq('id_da_partida', idDaPartida)
      .single()

    if (error || !data) {
      return { sucesso: false, erro: 'Replay não encontrado.', naoEncontrado: true }
    }

    return {
      sucesso: true,
      replay: data.dados_json as unknown as DadosDoReplay,
    }
  } catch (erro) {
    console.error('Erro ao buscar replay:', erro)
    return { sucesso: false, erro: 'Erro inesperado ao buscar replay.' }
  }
}
