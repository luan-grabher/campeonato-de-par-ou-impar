'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

export interface ConquistaDesbloqueada {
  id_da_conquista: string
  created_at: string
}

export interface ResultadoBuscarConquistasDoJogador {
  conquistas: ConquistaDesbloqueada[]
}

export async function buscarConquistasDoJogador(): Promise<ResultadoBuscarConquistasDoJogador> {
  const supabase = await criarClienteServidor()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { conquistas: [] }
  }

  const { data: conquistas } = await supabase
    .from('conquistas_dos_jogadores')
    .select('id_da_conquista, created_at')
    .eq('id_do_jogador', user.id)

  return {
    conquistas: (conquistas ?? []).map((c) => ({
      id_da_conquista: c.id_da_conquista as string,
      created_at: c.created_at as string,
    })),
  }
}
