'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import type { Cosmetico } from '@/supabase/tipos.gen'

interface CosmeticoDisponivel extends Cosmetico {
  jaPossui: boolean
}

export async function buscarCosmeticosDisponiveis(): Promise<
  CosmeticoDisponivel[] | { erro: string }
> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { erro: 'Usuário não autenticado.' }
    }

    // Buscar todos os cosméticos
    const { data: cosmeticos, error: erroCosmeticos } = await supabase
      .from('cosmeticos')
      .select('*')
      .order('tipo', { ascending: true })
      .order('preco_em_moedas', { ascending: true })

    if (erroCosmeticos || !cosmeticos) {
      console.error('Erro ao buscar cosméticos:', erroCosmeticos)
      return { erro: 'Erro ao buscar cosméticos disponíveis.' }
    }

    // Buscar IDs dos cosméticos que o jogador já possui
    const { data: cosmeticosDoJogador } = await supabase
      .from('cosmeticos_dos_jogadores')
      .select('id_do_cosmetico')
      .eq('id_do_jogador', user.id)

    const idsPossuidos = new Set(
      cosmeticosDoJogador?.map((c) => c.id_do_cosmetico) ?? []
    )

    const cosmeticosDisponiveis: CosmeticoDisponivel[] = cosmeticos.map(
      (cosmetico) => ({
        ...cosmetico,
        jaPossui: idsPossuidos.has(cosmetico.id),
      })
    )

    return cosmeticosDisponiveis
  } catch (erro) {
    console.error('Erro ao buscar cosméticos disponíveis:', erro)
    return { erro: 'Erro inesperado ao buscar cosméticos.' }
  }
}
