'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

export type ResultadoRemoverAmigo =
  | { status: 'sucesso' }
  | { status: 'erro'; mensagem: string }

export async function removerAmigo(
  idDoAmigo: string
): Promise<ResultadoRemoverAmigo> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    // Remover nos dois sentidos usando admin client (bypass RLS)
    const supabaseAdmin = criarClienteServidorAdmin()

    const { error: erroRemocao } = await supabaseAdmin
      .from('amigos')
      .delete()
      .or(
        `and(id_do_jogador.eq.${user.id},id_do_amigo.eq.${idDoAmigo}),and(id_do_jogador.eq.${idDoAmigo},id_do_amigo.eq.${user.id})`
      )

    if (erroRemocao) {
      console.error('Erro ao remover amigo:', erroRemocao)
      return { status: 'erro', mensagem: 'Erro ao remover amigo. Tente novamente.' }
    }

    return { status: 'sucesso' }
  } catch (erro) {
    console.error('Erro inesperado ao remover amigo:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao remover amigo.' }
  }
}
