'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

export interface PartidaDoChaveamento {
  id: string
  idDoPrimeiroJogador: string | null
  nomeDoPrimeiroJogador: string | null
  idDoSegundoJogador: string | null
  nomeDoSegundoJogador: string | null
  status: string
  vencedorId: string | null
  fase: number
  posicaoNaFase: number
  totalDeRodadasPrevisto: number
}

export interface FaseDoChaveamento {
  numero: number
  nome: string
  partidas: PartidaDoChaveamento[]
}

export interface DadosDoCampeonatoCompleto {
  id: string
  nome: string
  formato: string
  totalDeJogadores: number
  status: string
  createdAt: string
  fases: FaseDoChaveamento[]
  inscrito: boolean
  participante: boolean
}

export type ResultadoBuscarChaveamento =
  | { status: 'sucesso'; dados: DadosDoCampeonatoCompleto }
  | { status: 'erro'; mensagem: string }

function calcularNumeroDeFases(totalDeJogadores: number): number {
  return Math.log2(totalDeJogadores)
}

function nomeDaFase(numeroDaFase: number, totalDeFases: number): string {
  const indicesDoFinal: Record<number, number> = { 3: 3, 4: 4, 5: 5, 6: 6 }
  const faseFinal = indicesDoFinal[totalDeFases] ?? totalDeFases

  if (numeroDaFase === faseFinal) return 'Final'
  if (numeroDaFase === faseFinal - 1) return 'Semifinal'
  if (numeroDaFase === faseFinal - 2) return 'Quartas de Final'
  if (numeroDaFase === faseFinal - 3) return 'Oitavas de Final'
  return `Fase ${numeroDaFase}`
}

export async function buscarChaveamentoDoCampeonato(
  idDoCampeonato: string
): Promise<ResultadoBuscarChaveamento> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    const supabaseAdmin = criarClienteServidorAdmin()

    // Buscar campeonato
    const { data: campeonato, error: erroCampeonato } = await supabaseAdmin
      .from('campeonatos')
      .select('*')
      .eq('id', idDoCampeonato)
      .single()

    if (erroCampeonato || !campeonato) {
      return { status: 'erro', mensagem: 'Campeonato não encontrado.' }
    }

    // Verificar inscrição do usuário
    const { data: inscricao } = await supabaseAdmin
      .from('participantes_do_campeonato')
      .select('id_do_jogador')
      .eq('id_do_campeonato', idDoCampeonato)
      .eq('id_do_jogador', user.id)
      .maybeSingle()

    // Buscar partidas do campeonato
    const { data: partidas } = await supabaseAdmin
      .from('partidas')
      .select('id, id_do_primeiro_jogador, id_do_segundo_jogador, status, vencedor_id, total_de_rodadas_previsto')
      .eq('id_do_campeonato', idDoCampeonato)
      .order('created_at', { ascending: true })

    // Buscar nomes dos jogadores envolvidos
    const idsDosJogadores = new Set<string>()
    if (partidas) {
      for (const p of partidas) {
        if (p.id_do_primeiro_jogador) idsDosJogadores.add(p.id_do_primeiro_jogador as string)
        if (p.id_do_segundo_jogador) idsDosJogadores.add(p.id_do_segundo_jogador as string)
      }
    }

    const { data: perfis } = await supabaseAdmin
      .from('perfis')
      .select('id_usuario, nome')
      .in('id_usuario', Array.from(idsDosJogadores))

    const mapaDeNomes: Record<string, string> = {}
    if (perfis) {
      for (const perfil of perfis) {
        mapaDeNomes[perfil.id_usuario as string] = perfil.nome as string
      }
    }

    const totalDeFases = calcularNumeroDeFases(campeonato.total_de_jogadores)
    const totalDePartidasNaPrimeiraFase = campeonato.total_de_jogadores / 2

    // Organizar partidas por fase: as partidas são criadas na ordem do chaveamento
    // Primeiro as da fase 1, depois fase 2, etc.
    const fases: FaseDoChaveamento[] = []
    let offset = 0

    for (let fase = 1; fase <= totalDeFases; fase++) {
      const partidasPorFase = totalDePartidasNaPrimeiraFase / Math.pow(2, fase - 1)
      const partidasDaFase = (partidas ?? []).slice(offset, offset + partidasPorFase)

      const partidasMapeadas: PartidaDoChaveamento[] = partidasDaFase.map((p, posicao) => ({
        id: p.id as string,
        idDoPrimeiroJogador: p.id_do_primeiro_jogador as string | null,
        nomeDoPrimeiroJogador: p.id_do_primeiro_jogador
          ? (mapaDeNomes[p.id_do_primeiro_jogador as string] ?? 'Aguardando...')
          : null,
        idDoSegundoJogador: p.id_do_segundo_jogador as string | null,
        nomeDoSegundoJogador: p.id_do_segundo_jogador
          ? (mapaDeNomes[p.id_do_segundo_jogador as string] ?? 'Aguardando...')
          : null,
        status: p.status as string,
        vencedorId: p.vencedor_id as string | null,
        fase,
        posicaoNaFase: posicao,
        totalDeRodadasPrevisto: p.total_de_rodadas_previsto as number,
      }))

      fases.push({
        numero: fase,
        nome: nomeDaFase(fase, totalDeFases),
        partidas: partidasMapeadas,
      })

      offset += partidasPorFase
    }

    const dados: DadosDoCampeonatoCompleto = {
      id: campeonato.id as string,
      nome: campeonato.nome as string,
      formato: campeonato.formato as string,
      totalDeJogadores: campeonato.total_de_jogadores as number,
      status: campeonato.status as string,
      createdAt: campeonato.created_at as string,
      fases,
      inscrito: !!inscricao,
      participante: !!inscricao,
    }

    return { status: 'sucesso', dados }
  } catch (erro) {
    console.error('Erro inesperado ao buscar chaveamento:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao buscar chaveamento.' }
  }
}
