'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

export type ResultadoSairDaSobrevivencia =
  | { sucesso: true }
  | { sucesso: false; mensagem: string }

export async function sairDaFilaDeSobrevivencia(): Promise<ResultadoSairDaSobrevivencia> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Usuário não autenticado.' }
    }

    const { error } = await supabase
      .from('fila_de_sobrevivencia')
      .delete()
      .eq('id_do_jogador', user.id)

    if (error) {
      return { sucesso: false, mensagem: error.message }
    }

    return { sucesso: true }
  } catch (erro) {
    console.error('Erro ao sair da fila de sobrevivência:', erro)
    return { sucesso: false, mensagem: 'Erro inesperado ao sair da fila.' }
  }
}
