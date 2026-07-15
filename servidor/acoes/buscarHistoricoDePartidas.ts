'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { calcularElo } from '@/core/calculo/calcularElo'
import { K_FACTOR_PADRAO } from '@/core/constantes/pontuacao'

export interface PartidaNoHistorico {
  id: string
  modo: string
  tipo: string
  resultado: 'vitoria' | 'derrota' | 'empate'
  adversario: {
    id: string
    nome: string
    urlDoAvatar: string | null
  }
  eloGanho: number
  eloPerdido: number
  createdAt: string
}

export interface ResultadoBuscarHistorico {
  partidas: PartidaNoHistorico[]
  total: number
  pagina: number
  totalDePaginas: number
}

export type FiltroTipo = 'todas' | 'partida_rapida' | 'sala_privada' | 'campeonato'

const ITENS_POR_PAGINA = 10

export async function buscarHistoricoDePartidas(
  filtroTipo?: FiltroTipo,
  pagina: number = 1
): Promise<ResultadoBuscarHistorico | { erro: string }> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { erro: 'Usuário não autenticado.' }
    }

    // Montar query base para contar
    let queryCount = supabase
      .from('partidas')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'finalizada')
      .or(
        `id_do_primeiro_jogador.eq.${user.id},id_do_segundo_jogador.eq.${user.id}`
      )

    // Montar query base para buscar dados
    let queryData = supabase
      .from('partidas')
      .select('id, modo, tipo, vencedor_id, created_at, id_do_primeiro_jogador, id_do_segundo_jogador')
      .eq('status', 'finalizada')
      .or(
        `id_do_primeiro_jogador.eq.${user.id},id_do_segundo_jogador.eq.${user.id}`
      )

    // Aplicar filtro de tipo
    if (filtroTipo && filtroTipo !== 'todas') {
      queryCount = queryCount.eq('tipo', filtroTipo)
      queryData = queryData.eq('tipo', filtroTipo)
    }

    // Contar total
    const { count: total } = await queryCount

    const totalDeRegistros = total ?? 0
    const totalDePaginas = Math.max(1, Math.ceil(totalDeRegistros / ITENS_POR_PAGINA))
    const paginaSegura = Math.min(Math.max(1, pagina), totalDePaginas)
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA

    // Buscar partidas paginadas
    const { data: partidas } = await queryData
      .order('created_at', { ascending: false })
      .range(inicio, inicio + ITENS_POR_PAGINA - 1)

    if (!partidas || partidas.length === 0) {
      return {
        partidas: [],
        total: 0,
        pagina: paginaSegura,
        totalDePaginas,
      }
    }

    // Coletar IDs dos adversários
    const idsDosAdversarios = new Set<string>()

    for (const partida of partidas) {
      const idDoAdversario =
        partida.id_do_primeiro_jogador === user.id
          ? partida.id_do_segundo_jogador
          : partida.id_do_primeiro_jogador

      if (idDoAdversario) {
        idsDosAdversarios.add(idDoAdversario as string)
      }
    }

    // Buscar perfis dos adversários
    const { data: perfisAdversarios } = await supabase
      .from('perfis')
      .select('id_usuario, nome, url_do_avatar, elo')
      .in('id_usuario', Array.from(idsDosAdversarios))

    const mapaDeAdversarios = new Map<
      string,
      { nome: string; urlDoAvatar: string | null; elo: number }
    >()

    if (perfisAdversarios) {
      for (const p of perfisAdversarios) {
        mapaDeAdversarios.set(p.id_usuario as string, {
          nome: p.nome as string,
          urlDoAvatar: p.url_do_avatar as string | null,
          elo: (p.elo as number) ?? 1200,
        })
      }
    }

    // Buscar elo atual do usuário logado
    const { data: perfilUsuario } = await supabase
      .from('perfis')
      .select('elo')
      .eq('id_usuario', user.id)
      .single()

    const eloAtualDoUsuario = (perfilUsuario?.elo as number) ?? 1200

    // Montar resultado
    const historico: PartidaNoHistorico[] = partidas.map((partida) => {
      const idDoAdversario =
        partida.id_do_primeiro_jogador === user.id
          ? partida.id_do_segundo_jogador
          : partida.id_do_primeiro_jogador

      const dadosDoAdversario = mapaDeAdversarios.get(idDoAdversario as string) ?? {
        nome: 'Desconhecido',
        urlDoAvatar: null,
        elo: 1200,
      }

      let resultado: 'vitoria' | 'derrota' | 'empate' = 'empate'
      if (partida.vencedor_id === user.id) {
        resultado = 'vitoria'
      } else if (partida.vencedor_id && partida.vencedor_id !== user.id) {
        resultado = 'derrota'
      }

      // Calcular Elo aproximado com base nos Elos atuais
      let eloGanho = 0
      let eloPerdido = 0

      if (resultado === 'vitoria') {
        const { novoEloDoVencedor } = calcularElo(
          eloAtualDoUsuario,
          dadosDoAdversario.elo,
          K_FACTOR_PADRAO
        )
        eloGanho = novoEloDoVencedor - eloAtualDoUsuario
      } else if (resultado === 'derrota') {
        const { novoEloDoPerdedor } = calcularElo(
          dadosDoAdversario.elo,
          eloAtualDoUsuario,
          K_FACTOR_PADRAO
        )
        eloPerdido = eloAtualDoUsuario - novoEloDoPerdedor
      }

      return {
        id: partida.id as string,
        modo: partida.modo as string,
        tipo: partida.tipo as string,
        resultado,
        adversario: {
          id: idDoAdversario as string,
          nome: dadosDoAdversario.nome,
          urlDoAvatar: dadosDoAdversario.urlDoAvatar,
        },
        eloGanho,
        eloPerdido,
        createdAt: partida.created_at as string,
      }
    })

    return {
      partidas: historico,
      total: totalDeRegistros,
      pagina: paginaSegura,
      totalDePaginas,
    }
  } catch (erro) {
    console.error('Erro ao buscar histórico de partidas:', erro)
    return { erro: 'Erro inesperado ao buscar histórico.' }
  }
}
