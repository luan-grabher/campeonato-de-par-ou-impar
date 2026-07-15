'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

export type ResultadoRecusarConvite =
  | { status: 'sucesso' }
  | { status: 'erro'; mensagem: string }

export async function recusarConviteDeAmizade(
  idDoConvite: string
): Promise<ResultadoRecusarConvite> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    // Buscar convite para verificar permissão
    const { data: convite, error: erroBusca } = await supabase
      .from('convites_de_amizade')
      .select('*')
      .eq('id', idDoConvite)
      .single()

    if (erroBusca || !convite) {
      return { status: 'erro', mensagem: 'Convite não encontrado.' }
    }

    if (convite.id_do_destinatario !== user.id) {
      return { status: 'erro', mensagem: 'Você não pode recusar este convite.' }
    }

    if (convite.status !== 'pendente') {
      return { status: 'erro', mensagem: 'Este convite já foi processado.' }
    }

    // Atualizar status para recusado
    const { error: erroAtualizacao } = await supabase
      .from('convites_de_amizade')
      .update({ status: 'recusado' })
      .eq('id', idDoConvite)

    if (erroAtualizacao) {
      console.error('Erro ao recusar convite:', erroAtualizacao)
      return { status: 'erro', mensagem: 'Erro ao recusar convite. Tente novamente.' }
    }

    return { status: 'sucesso' }
  } catch (erro) {
    console.error('Erro inesperado ao recusar convite:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao recusar convite.' }
  }
}
