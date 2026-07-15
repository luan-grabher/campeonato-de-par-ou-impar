'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import type { Cosmetico, CosmeticoDoJogador } from '@/supabase/tipos.gen'

interface CosmeticoNoInventario extends Cosmetico {
  equipado: boolean
  adquiridoEm: string
}

export async function buscarInventarioDoJogador(): Promise<
  CosmeticoNoInventario[] | { erro: string }
> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { erro: 'Usuário não autenticado.' }
    }

    // Buscar cosméticos do jogador com dados do cosmético via join
    const { data: inventario, error: erroInventario } = await supabase
      .from('cosmeticos_dos_jogadores')
      .select(
        `
        equipado,
        created_at,
        cosmetico:cosmeticos(*)
      `
      )
      .eq('id_do_jogador', user.id)

    if (erroInventario || !inventario) {
      console.error('Erro ao buscar inventário:', erroInventario)
      return { erro: 'Erro ao buscar inventário.' }
    }

    const inventarioMapeado: CosmeticoNoInventario[] = inventario.map(
      (item) => {
        const cosmetico = item.cosmetico as unknown as Cosmetico
        return {
          ...cosmetico,
          equipado: item.equipado,
          adquiridoEm: item.created_at,
        }
      }
    )

    return inventarioMapeado
  } catch (erro) {
    console.error('Erro ao buscar inventário:', erro)
    return { erro: 'Erro inesperado ao buscar inventário.' }
  }
}
