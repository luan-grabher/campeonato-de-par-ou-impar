'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

export type ResultadoAceitarConvite =
  | { status: 'sucesso' }
  | { status: 'erro'; mensagem: string }

/**
 * Função auxiliar exportada para criar a amizade bidirecional (usada pelo enviarConviteDeAmizade
 * quando há convite mútuo pendente).
 */
export async function aceitarAmizadeBidirecional(
  idDoJogador: string,
  idDoAmigo: string
): Promise<void> {
  const supabaseAdmin = criarClienteServidorAdmin()

  // Inserir amizade nos dois sentidos
  await supabaseAdmin.from('amigos').upsert(
    [
      { id_do_jogador: idDoJogador, id_do_amigo: idDoAmigo },
      { id_do_jogador: idDoAmigo, id_do_amigo: idDoJogador },
    ],
    { onConflict: 'id_do_jogador, id_do_amigo' }
  )
}

export async function aceitarConviteDeAmizade(
  idDoConvite: string
): Promise<ResultadoAceitarConvite> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    // Buscar convite
    const { data: convite, error: erroBusca } = await supabase
      .from('convites_de_amizade')
      .select('*')
      .eq('id', idDoConvite)
      .single()

    if (erroBusca || !convite) {
      return { status: 'erro', mensagem: 'Convite não encontrado.' }
    }

    if (convite.id_do_destinatario !== user.id) {
      return { status: 'erro', mensagem: 'Este convite não foi enviado para você.' }
    }

    if (convite.status !== 'pendente') {
      return { status: 'erro', mensagem: 'Este convite já foi processado.' }
    }

    // Atualizar status do convite
    const { error: erroAtualizacao } = await supabase
      .from('convites_de_amizade')
      .update({ status: 'aceito' })
      .eq('id', idDoConvite)

    if (erroAtualizacao) {
      console.error('Erro ao aceitar convite:', erroAtualizacao)
      return { status: 'erro', mensagem: 'Erro ao aceitar convite. Tente novamente.' }
    }

    // Criar amizade bidirecional via admin (para bypass RLS)
    await aceitarAmizadeBidirecional(user.id, convite.id_do_remetente)

    return { status: 'sucesso' }
  } catch (erro) {
    console.error('Erro inesperado ao aceitar convite:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao aceitar convite.' }
  }
}
