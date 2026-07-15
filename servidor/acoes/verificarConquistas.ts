'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

interface CondicaoJson {
  tipo: string
  operador: '>=' | '>' | '==' | '<' | '<='
  valor: number
  modo?: string
}

interface Conquista {
  id: string
  nome: string
  descricao: string
  icone: string
  condicao_json: CondicaoJson
}

interface DadosDoPerfil {
  id_usuario: string
  total_de_vitorias: number
  total_de_derrotas: number
  total_de_partidas: number
  sequencia_atual: number
  maior_sequencia: number
  elo: number
  numero_favorito: number | null
}

export interface ConquistaNova {
  id: string
  nome: string
  descricao: string
  icone: string
}

export interface ResultadoVerificarConquistas {
  conquistasNovas: ConquistaNova[]
  erro?: string
}

/**
 * Verifica conquistas para um jogador específico.
 * Deve ser chamada após uma partida ser finalizada.
 *
 * @param idDoJogador - ID do jogador para verificar conquistas
 * @returns Lista de conquistas recém-desbloqueadas
 */
export async function verificarConquistas(
  idDoJogador: string
): Promise<ResultadoVerificarConquistas> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { conquistasNovas: [], erro: 'Usuário não autenticado.' }
    }

    const supabaseAdmin = criarClienteServidorAdmin()

    // 1. Buscar todas as conquistas disponíveis
    const { data: todasAsConquistas } = await supabaseAdmin
      .from('conquistas')
      .select('*')

    if (!todasAsConquistas || todasAsConquistas.length === 0) {
      return { conquistasNovas: [] }
    }

    // 2. Buscar conquistas que o jogador já possui
    const { data: conquistasDoJogador } = await supabaseAdmin
      .from('conquistas_dos_jogadores')
      .select('id_da_conquista')
      .eq('id_do_jogador', idDoJogador)

    const idsDasConquistasExistentes = new Set(
      (conquistasDoJogador ?? []).map((c) => c.id_da_conquista as string)
    )

    // 3. Filtrar apenas conquistas que o jogador ainda não tem
    const conquistasPendentes = todasAsConquistas.filter(
      (c) => !idsDasConquistasExistentes.has(c.id as string)
    )

    if (conquistasPendentes.length === 0) {
      return { conquistasNovas: [] }
    }

    // 4. Buscar dados do perfil do jogador
    const { data: perfil } = await supabaseAdmin
      .from('perfis')
      .select('*')
      .eq('id_usuario', idDoJogador)
      .single()

    if (!perfil) {
      return { conquistasNovas: [], erro: 'Perfil não encontrado.' }
    }

    const dadosDoPerfil = perfil as unknown as DadosDoPerfil

    // 5. Buscar dados adicionais necessários para verificação
    const [
      totalAmigos,
      campeonatosVencidos,
      { data: rodadasDaUltimaPartida },
    ] = await Promise.all([
      // Contar amigos
      supabaseAdmin
        .from('amigos')
        .select('*', { count: 'exact', head: true })
        .eq('id_do_jogador', idDoJogador),

      // Contar campeonatos vencidos
      supabaseAdmin
        .from('participantes_do_campeonato')
        .select('*', { count: 'exact', head: true })
        .eq('id_do_jogador', idDoJogador)
        .eq('posicao_final', 1),

      // Buscar última partida finalizada para verificar condições específicas
      supabaseAdmin
        .from('rodadas')
        .select('*, partidas!inner(id, modo, status, vencedor_id, id_do_primeiro_jogador, id_do_segundo_jogador)')
        .eq('partidas.status', 'finalizada')
        .or(
          `partidas.id_do_primeiro_jogador.eq.${idDoJogador},partidas.id_do_segundo_jogador.eq.${idDoJogador}`
        )
        .order('partidas.created_at', { ascending: false } as any)
        .limit(100),
    ])

    const totalDeAmigos = totalAmigos.count ?? 0
    const totalCampeonatosVencidos = campeonatosVencidos.count ?? 0

    // 6. Verificar cada conquista pendente
    const conquistasNovas: ConquistaNova[] = []

    for (const conquista of conquistasPendentes) {
      const condicao = conquista.condicao_json as unknown as CondicaoJson
      const condicaoAtendida = await verificarCondicao(
        condicao,
        dadosDoPerfil,
        totalDeAmigos,
        totalCampeonatosVencidos,
        rodadasDaUltimaPartida ?? [],
        idDoJogador,
        supabaseAdmin
      )

      if (condicaoAtendida) {
        // Inserir conquista desbloqueada
        const { error: erroInsercao } = await supabaseAdmin
          .from('conquistas_dos_jogadores')
          .insert({
            id_do_jogador: idDoJogador,
            id_da_conquista: conquista.id,
          })

        if (!erroInsercao) {
          conquistasNovas.push({
            id: conquista.id as string,
            nome: conquista.nome as string,
            descricao: conquista.descricao as string,
            icone: conquista.icone as string,
          })
        }
      }
    }

    return { conquistasNovas }
  } catch (erro) {
    console.error('Erro ao verificar conquistas:', erro)
    return { conquistasNovas: [], erro: 'Erro inesperado ao verificar conquistas.' }
  }
}

async function verificarCondicao(
  condicao: CondicaoJson,
  perfil: DadosDoPerfil,
  totalDeAmigos: number,
  campeonatosVencidos: number,
  rodadasDaUltimaPartida: any[],
  idDoJogador: string,
  supabaseAdmin: ReturnType<typeof criarClienteServidorAdmin>
): Promise<boolean> {
  const { tipo, operador, valor } = condicao
  let valorAtual: number

  switch (tipo) {
    case 'vitorias':
      valorAtual = perfil.total_de_vitorias
      break

    case 'sequencia_maxima':
      valorAtual = perfil.maior_sequencia
      break

    case 'elo':
      valorAtual = perfil.elo
      break

    case 'campeonatos_vencidos':
      valorAtual = campeonatosVencidos
      break

    case 'partidas_totais':
      valorAtual = perfil.total_de_partidas
      break

    case 'total_amigos':
      valorAtual = totalDeAmigos
      break

    case 'vitorias_modo':
      return await verificarVitoriasNoModo(
        condicao.modo!,
        idDoJogador,
        supabaseAdmin
      )

    case 'numero_favorito_todas_rodadas':
      return await verificarNumeroFavoritoTodasRodadas(
        perfil.numero_favorito,
        rodadasDaUltimaPartida,
        idDoJogador
      )

    default:
      return false
  }

  return comparar(valorAtual, operador, valor)
}

async function verificarVitoriasNoModo(
  modo: string,
  idDoJogador: string,
  supabaseAdmin: ReturnType<typeof criarClienteServidorAdmin>
): Promise<boolean> {
  const { count } = await supabaseAdmin
    .from('partidas')
    .select('*', { count: 'exact', head: true })
    .eq('modo', modo)
    .eq('status', 'finalizada')
    .eq('vencedor_id', idDoJogador)

  return (count ?? 0) >= 1
}

async function verificarNumeroFavoritoTodasRodadas(
  numeroFavorito: number | null,
  rodadas: any[],
  idDoJogador: string
): Promise<boolean> {
  if (!numeroFavorito) return false

  // Agrupar rodadas por partida e verificar se em alguma partida
  // o jogador usou o número favorito em todas as rodadas
  const partidas = new Map<string, any[]>()

  for (const rodada of rodadas) {
    const idDaPartida = rodada.id_da_partida as string
    if (!partidas.has(idDaPartida)) {
      partidas.set(idDaPartida, [])
    }
    partidas.get(idDaPartida)!.push(rodada)
  }

  for (const rodadasDaPartida of Array.from(partidas.values())) {
    // Verificar se em todas as rodadas dessa partida o jogador usou o número favorito
    const todasUsaramFavorito = rodadasDaPartida.every((rodada: any) => {
      const numeroDoJogador =
        rodada.partidas?.id_do_primeiro_jogador === idDoJogador
          ? rodada.numero_do_primeiro_jogador
          : rodada.numero_do_segundo_jogador

      return numeroDoJogador === numeroFavorito
    })

    if (todasUsaramFavorito) {
      return true
    }
  }

  return false
}

function comparar(valorAtual: number, operador: string, valor: number): boolean {
  switch (operador) {
    case '>=':
      return valorAtual >= valor
    case '>':
      return valorAtual > valor
    case '==':
      return valorAtual === valor
    case '<':
      return valorAtual < valor
    case '<=':
      return valorAtual <= valor
    default:
      return false
  }
}
