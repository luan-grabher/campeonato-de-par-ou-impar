'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

export interface JogadorNoRanking {
  posicao: number
  id: string
  nome: string
  elo: number
  totalDePartidas: number
  totalDeVitorias: number
}

export interface ResultadoBuscarRanking {
  jogadores: JogadorNoRanking[]
  total: number
  pagina: number
  totalDePaginas: number
}

const ITENS_POR_PAGINA = 20

export async function buscarRanking(
  pagina: number = 1
): Promise<ResultadoBuscarRanking> {
  const supabase = await criarClienteServidor()

  // Contar total de perfis
  const { count: total } = await supabase
    .from('perfis')
    .select('*', { count: 'exact', head: true })

  const totalDeRegistros = total ?? 0
  const totalDePaginas = Math.max(1, Math.ceil(totalDeRegistros / ITENS_POR_PAGINA))
  const paginaSegura = Math.min(Math.max(1, pagina), totalDePaginas)
  const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA

  const { data: perfis } = await supabase
    .from('perfis')
    .select('id_usuario, nome, elo, total_de_partidas, total_de_vitorias')
    .order('elo', { ascending: false })
    .range(inicio, inicio + ITENS_POR_PAGINA - 1)

  const jogadores: JogadorNoRanking[] = (perfis ?? []).map((perfil, index) => ({
    posicao: inicio + index + 1,
    id: perfil.id_usuario as string,
    nome: perfil.nome as string,
    elo: perfil.elo as number,
    totalDePartidas: perfil.total_de_partidas as number,
    totalDeVitorias: perfil.total_de_vitorias as number,
  }))

  return {
    jogadores,
    total: totalDeRegistros,
    pagina: paginaSegura,
    totalDePaginas,
  }
}
