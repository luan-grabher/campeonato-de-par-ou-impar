'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

export interface Conquista {
  id: string
  nome: string
  descricao: string
  icone: string
  condicao_json: Record<string, unknown>
  created_at: string
}

export interface ResultadoBuscarTodasAsConquistas {
  conquistas: Conquista[]
}

export async function buscarTodasAsConquistas(): Promise<ResultadoBuscarTodasAsConquistas> {
  const supabase = await criarClienteServidor()

  const { data: conquistas } = await supabase
    .from('conquistas')
    .select('*')
    .order('id', { ascending: true })

  return {
    conquistas: (conquistas ?? []).map((c) => ({
      id: c.id as string,
      nome: c.nome as string,
      descricao: c.descricao as string,
      icone: c.icone as string,
      condicao_json: c.condicao_json as Record<string, unknown>,
      created_at: c.created_at as string,
    })),
  }
}
