'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

export type ResultadoInscricao =
  | { status: 'sucesso' }
  | { status: 'erro'; mensagem: string }

export async function inscreverNoCampeonato(
  idDoCampeonato: string
): Promise<ResultadoInscricao> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    const supabaseAdmin = criarClienteServidorAdmin()

    // Buscar campeonato
    const { data: campeonato, error: erroCampeonato } = await supabaseAdmin
      .from('campeonatos')
      .select('id, status, total_de_jogadores')
      .eq('id', idDoCampeonato)
      .single()

    if (erroCampeonato || !campeonato) {
      return { status: 'erro', mensagem: 'Campeonato não encontrado.' }
    }

    if (campeonato.status !== 'inscricoes_abertas') {
      return { status: 'erro', mensagem: 'Inscrições não estão abertas para este campeonato.' }
    }

    // Verificar se já está inscrito
    const { data: inscricaoExistente } = await supabaseAdmin
      .from('participantes_do_campeonato')
      .select('id_do_jogador')
      .eq('id_do_campeonato', idDoCampeonato)
      .eq('id_do_jogador', user.id)
      .maybeSingle()

    if (inscricaoExistente) {
      return { status: 'erro', mensagem: 'Você já está inscrito neste campeonato.' }
    }

    // Verificar limite de vagas
    const { count: totalInscritos } = await supabaseAdmin
      .from('participantes_do_campeonato')
      .select('*', { count: 'exact', head: true })
      .eq('id_do_campeonato', idDoCampeonato)

    if (totalInscritos !== null && totalInscritos >= campeonato.total_de_jogadores) {
      return { status: 'erro', mensagem: 'Campeonato já está com todas as vagas preenchidas.' }
    }

    // Inscrever
    const { error: erroInscricao } = await supabaseAdmin
      .from('participantes_do_campeonato')
      .insert({
        id_do_campeonato: idDoCampeonato,
        id_do_jogador: user.id,
      })

    if (erroInscricao) {
      console.error('Erro ao inscrever:', erroInscricao)
      return { status: 'erro', mensagem: 'Erro ao realizar inscrição. Tente novamente.' }
    }

    return { status: 'sucesso' }
  } catch (erro) {
    console.error('Erro inesperado ao inscrever:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao inscrever no campeonato.' }
  }
}
