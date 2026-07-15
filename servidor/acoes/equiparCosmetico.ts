'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

interface ResultadoEquipamento {
  sucesso: boolean
  erro?: string
}

export async function equiparCosmetico(
  idDoCosmetico: string,
  equipar: boolean
): Promise<ResultadoEquipamento> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, erro: 'Usuário não autenticado.' }
    }

    // Verificar se o jogador possui o cosmético
    const { data: cosmeticoDoJogador, error: erroBusca } = await supabase
      .from('cosmeticos_dos_jogadores')
      .select('id_do_cosmetico')
      .eq('id_do_jogador', user.id)
      .eq('id_do_cosmetico', idDoCosmetico)
      .single()

    if (erroBusca || !cosmeticoDoJogador) {
      return { sucesso: false, erro: 'Você não possui este cosmético.' }
    }

    if (equipar) {
      // Descobrir o tipo do cosmético para desequipar outros do mesmo tipo
      const { data: cosmetico } = await supabase
        .from('cosmeticos')
        .select('tipo')
        .eq('id', idDoCosmetico)
        .single()

      if (!cosmetico) {
        return { sucesso: false, erro: 'Cosmético não encontrado.' }
      }

      // Buscar todos os IDs de cosméticos do mesmo tipo
      const { data: cosmeticosDoMesmoTipo } = await supabase
        .from('cosmeticos')
        .select('id')
        .eq('tipo', cosmetico.tipo)

      const idsDoMesmoTipo =
        cosmeticosDoMesmoTipo?.map((c) => c.id) ?? []

      if (idsDoMesmoTipo.length > 0) {
        // Desequipar todos os cosméticos do mesmo tipo
        const { error: erroDesequipar } = await supabase
          .from('cosmeticos_dos_jogadores')
          .update({ equipado: false })
          .eq('id_do_jogador', user.id)
          .in('id_do_cosmetico', idsDoMesmoTipo)

        if (erroDesequipar) {
          console.error('Erro ao desequipar cosméticos:', erroDesequipar)
          return {
            sucesso: false,
            erro: 'Erro ao desequipar cosméticos anteriores.',
          }
        }
      }
    }

    // Equipar ou desequipar o cosmético
    const { error: erroAtualizar } = await supabase
      .from('cosmeticos_dos_jogadores')
      .update({ equipado: equipar })
      .eq('id_do_jogador', user.id)
      .eq('id_do_cosmetico', idDoCosmetico)

    if (erroAtualizar) {
      console.error('Erro ao atualizar equipamento:', erroAtualizar)
      return { sucesso: false, erro: 'Erro ao alterar equipamento.' }
    }

    return { sucesso: true }
  } catch (erro) {
    console.error('Erro ao equipar cosmético:', erro)
    return { sucesso: false, erro: 'Erro inesperado ao equipar cosmético.' }
  }
}
