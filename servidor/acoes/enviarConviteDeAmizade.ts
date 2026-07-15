'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

export type ResultadoEnviarConvite =
  | { status: 'sucesso' }
  | { status: 'erro'; mensagem: string }

export async function enviarConviteDeAmizade(
  idDoDestinatario: string
): Promise<ResultadoEnviarConvite> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    if (user.id === idDoDestinatario) {
      return { status: 'erro', mensagem: 'Você não pode enviar um convite para si mesmo.' }
    }

    // Verificar se já são amigos
    const { data: amizadeExistente } = await supabase
      .from('amigos')
      .select('id_do_jogador')
      .eq('id_do_jogador', user.id)
      .eq('id_do_amigo', idDoDestinatario)
      .maybeSingle()

    if (amizadeExistente) {
      return { status: 'erro', mensagem: 'Este jogador já é seu amigo.' }
    }

    // Verificar se já existe convite pendente do remetente
    const { data: conviteExistente } = await supabase
      .from('convites_de_amizade')
      .select('id, status')
      .eq('id_do_remetente', user.id)
      .eq('id_do_destinatario', idDoDestinatario)
      .maybeSingle()

    if (conviteExistente) {
      if (conviteExistente.status === 'pendente') {
        return { status: 'erro', mensagem: 'Você já enviou um convite para este jogador.' }
      }
      if (conviteExistente.status === 'aceito') {
        return { status: 'erro', mensagem: 'Este jogador já é seu amigo.' }
      }
      // Se estava recusado, podemos reenviar — exclui o antigo e cria novo
      await supabase
        .from('convites_de_amizade')
        .delete()
        .eq('id', conviteExistente.id)
    }

    // Verificar se o destinatário já nos enviou um convite pendente (convite mútuo → aceitar automaticamente)
    const { data: conviteReverso } = await supabase
      .from('convites_de_amizade')
      .select('id')
      .eq('id_do_remetente', idDoDestinatario)
      .eq('id_do_destinatario', user.id)
      .eq('status', 'pendente')
      .maybeSingle()

    if (conviteReverso) {
      // Aceitar automaticamente — criar amizade bidirecional
      await supabase
        .from('convites_de_amizade')
        .update({ status: 'aceito' })
        .eq('id', conviteReverso.id)

      // Import dinâmico para evitar circular
      const { aceitarAmizadeBidirecional } = await import('./aceitarConviteDeAmizade')
      await aceitarAmizadeBidirecional(user.id, idDoDestinatario)

      return { status: 'sucesso' }
    }

    // Criar convite
    const { error: erroInsercao } = await supabase.from('convites_de_amizade').insert({
      id_do_remetente: user.id,
      id_do_destinatario: idDoDestinatario,
      status: 'pendente',
    })

    if (erroInsercao) {
      console.error('Erro ao enviar convite:', erroInsercao)
      return { status: 'erro', mensagem: 'Erro ao enviar convite. Tente novamente.' }
    }

    return { status: 'sucesso' }
  } catch (erro) {
    console.error('Erro inesperado ao enviar convite:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao enviar convite.' }
  }
}
