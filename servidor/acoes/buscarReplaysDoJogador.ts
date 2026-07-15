'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import type { DadosDoReplay } from '@/core/tipos/replay'

export interface ReplayResumido {
  id: string
  idDaPartida: string
  modo: string
  tipo: string
  adversario: {
    nome: string
    avatar: string | null
  }
  vencedorId: string
  totalDeRodadas: number
  createdAt: string
}

export type ResultadoBuscarReplays =
  | { sucesso: true; replays: ReplayResumido[]; total: number }
  | { sucesso: false; erro: string }

export async function buscarReplaysDoJogador(
  pagina: number = 1,
  porPagina: number = 10
): Promise<ResultadoBuscarReplays> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, erro: 'Usuário não autenticado.' }
    }

    // Buscar partidas do jogador que têm replay
    const inicio = (pagina - 1) * porPagina

    const { data: partidas, count: total, error: erroPartidas } = await supabase
      .from('partidas')
      .select(
        `id, modo, tipo, vencedor_id, total_de_rodadas_previsto, created_at,
         id_do_primeiro_jogador, id_do_segundo_jogador`,
        { count: 'exact' }
      )
      .eq('status', 'finalizada')
      .or(`id_do_primeiro_jogador.eq.${user.id},id_do_segundo_jogador.eq.${user.id}`)
      .in('id', (
        await supabase.from('replays').select('id_da_partida')
      ).data?.map(r => r.id_da_partida) ?? [])
      .order('created_at', { ascending: false })
      .range(inicio, inicio + porPagina - 1)

    if (erroPartidas || !partidas) {
      return { sucesso: false, erro: 'Erro ao buscar replays.' }
    }

    // Coletar IDs dos adversários
    const idsDosAdversarios = new Set<string>()
    for (const p of partidas) {
      const idDoAdv = p.id_do_primeiro_jogador === user.id
        ? p.id_do_segundo_jogador
        : p.id_do_primeiro_jogador
      if (idDoAdv) idsDosAdversarios.add(idDoAdv as string)
    }

    // Buscar perfis dos adversários
    const { data: perfis } = await supabase
      .from('perfis')
      .select('id_usuario, nome, url_do_avatar')
      .in('id_usuario', Array.from(idsDosAdversarios))

    const mapaPerfis = new Map<string, { nome: string; avatar: string | null }>()
    if (perfis) {
      for (const p of perfis) {
        mapaPerfis.set(p.id_usuario as string, {
          nome: p.nome as string,
          avatar: p.url_do_avatar as string | null,
        })
      }
    }

    const replays: ReplayResumido[] = partidas.map((p) => {
      const idDoAdv = p.id_do_primeiro_jogador === user.id
        ? p.id_do_segundo_jogador
        : p.id_do_primeiro_jogador
      const dadosAdv = mapaPerfis.get(idDoAdv as string) ?? { nome: 'Desconhecido', avatar: null }

      return {
        id: p.id as string,
        idDaPartida: p.id as string,
        modo: p.modo as string,
        tipo: p.tipo as string,
        adversario: dadosAdv,
        vencedorId: p.vencedor_id as string,
        totalDeRodadas: p.total_de_rodadas_previsto as number,
        createdAt: p.created_at as string,
      }
    })

    return {
      sucesso: true,
      replays,
      total: total ?? 0,
    }
  } catch (erro) {
    console.error('Erro ao buscar replays do jogador:', erro)
    return { sucesso: false, erro: 'Erro inesperado ao buscar replays.' }
  }
}
