'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

interface ResultadoCompra {
  sucesso: boolean
  erro?: string
  moedasRestantes?: number
}

export async function comprarCosmetico(
  idDoCosmetico: string
): Promise<ResultadoCompra> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, erro: 'Usuário não autenticado.' }
    }

    // Verificar se o jogador já possui o cosmético
    const { data: jaPossui } = await supabase
      .from('cosmeticos_dos_jogadores')
      .select('id_do_cosmetico')
      .eq('id_do_jogador', user.id)
      .eq('id_do_cosmetico', idDoCosmetico)
      .maybeSingle()

    if (jaPossui) {
      return { sucesso: false, erro: 'Você já possui este cosmético.' }
    }

    // Buscar o cosmético e o perfil do jogador em paralelo
    const [resultadoCosmetico, resultadoPerfil] = await Promise.all([
      supabase
        .from('cosmeticos')
        .select('preco_em_moedas')
        .eq('id', idDoCosmetico)
        .single(),
      supabase
        .from('perfis')
        .select('moedas')
        .eq('id_usuario', user.id)
        .single(),
    ])

    if (resultadoCosmetico.error || !resultadoCosmetico.data) {
      return { sucesso: false, erro: 'Cosmético não encontrado.' }
    }

    if (resultadoPerfil.error || !resultadoPerfil.data) {
      return { sucesso: false, erro: 'Perfil não encontrado.' }
    }

    const preco = resultadoCosmetico.data.preco_em_moedas
    const moedasAtuais = resultadoPerfil.data.moedas

    if (moedasAtuais < preco) {
      return {
        sucesso: false,
        erro: `Moedas insuficientes. Você tem ${moedasAtuais} e precisa de ${preco}.`,
      }
    }

    // Usar transação: deduzir moedas e adicionar cosmético ao inventário
    const { error: erroDeducao } = await supabase
      .from('perfis')
      .update({ moedas: moedasAtuais - preco })
      .eq('id_usuario', user.id)

    if (erroDeducao) {
      console.error('Erro ao deduzir moedas:', erroDeducao)
      return { sucesso: false, erro: 'Erro ao processar pagamento.' }
    }

    const { error: erroAdicionar } = await supabase
      .from('cosmeticos_dos_jogadores')
      .insert({
        id_do_jogador: user.id,
        id_do_cosmetico: idDoCosmetico,
        equipado: false,
      })

    if (erroAdicionar) {
      // Reverter dedução em caso de erro
      await supabase
        .from('perfis')
        .update({ moedas: moedasAtuais })
        .eq('id_usuario', user.id)

      console.error('Erro ao adicionar cosmético ao inventário:', erroAdicionar)
      return { sucesso: false, erro: 'Erro ao adicionar cosmético ao inventário.' }
    }

    return {
      sucesso: true,
      moedasRestantes: moedasAtuais - preco,
    }
  } catch (erro) {
    console.error('Erro ao comprar cosmético:', erro)
    return { sucesso: false, erro: 'Erro inesperado ao comprar cosmético.' }
  }
}
