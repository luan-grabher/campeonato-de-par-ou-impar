'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

export type ResultadoCancelarInscricao =
  | { status: 'sucesso' }
  | { status: 'erro'; mensagem: string }

export async function cancelarInscricaoNoCampeonato(
  idDoCampeonato: string
): Promise<ResultadoCancelarInscricao> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    const supabaseAdmin = criarClienteServidorAdmin()

    // Verificar status do campeonato
    const { data: campeonato } = await supabaseAdmin
      .from('campeonatos')
      .select('status')
      .eq('id', idDoCampeonato)
      .single()

    if (!campeonato) {
      return { status: 'erro', mensagem: 'Campeonato não encontrado.' }
    }

    if (campeonato.status !== 'inscricoes_abertas') {
      return { status: 'erro', mensagem: 'Não é possível cancelar a inscrição após o início do campeonato.' }
    }

    const { error } = await supabaseAdmin
      .from('participantes_do_campeonato')
      .delete()
      .eq('id_do_campeonato', idDoCampeonato)
      .eq('id_do_jogador', user.id)

    if (error) {
      console.error('Erro ao cancelar inscrição:', error)
      return { status: 'erro', mensagem: 'Erro ao cancelar inscrição.' }
    }

    return { status: 'sucesso' }
  } catch (erro) {
    console.error('Erro inesperado ao cancelar inscrição:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao cancelar inscrição.' }
  }
}
