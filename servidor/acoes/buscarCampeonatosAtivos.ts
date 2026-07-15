'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

export interface CampeonatoAtivo {
  id: string
  nome: string
  formato: string
  totalDeJogadores: number
  status: string
  createdAt: string
  totalDeInscritos: number
  inscrito: boolean
}

export type ResultadoBuscarCampeonatosAtivos =
  | { status: 'sucesso'; campeonatos: CampeonatoAtivo[] }
  | { status: 'erro'; mensagem: string }

export async function buscarCampeonatosAtivos(): Promise<ResultadoBuscarCampeonatosAtivos> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    const supabaseAdmin = criarClienteServidorAdmin()

    // Buscar campeonatos não cancelados
    const { data: campeonatos, error } = await supabaseAdmin
      .from('campeonatos')
      .select('*')
      .in('status', ['inscricoes_abertas', 'em_andamento'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar campeonatos:', error)
      return { status: 'erro', mensagem: 'Erro ao buscar campeonatos.' }
    }

    if (!campeonatos || campeonatos.length === 0) {
      return { status: 'sucesso', campeonatos: [] }
    }

    // Para cada campeonato, contar inscritos e verificar inscrição do usuário
    const campeonatosProcessados: CampeonatoAtivo[] = await Promise.all(
      campeonatos.map(async (campeonato) => {
        const { count: totalInscritos } = await supabaseAdmin
          .from('participantes_do_campeonato')
          .select('*', { count: 'exact', head: true })
          .eq('id_do_campeonato', campeonato.id)

        const { data: inscricao } = await supabaseAdmin
          .from('participantes_do_campeonato')
          .select('id_do_jogador')
          .eq('id_do_campeonato', campeonato.id)
          .eq('id_do_jogador', user.id)
          .maybeSingle()

        return {
          id: campeonato.id as string,
          nome: campeonato.nome as string,
          formato: campeonato.formato as string,
          totalDeJogadores: campeonato.total_de_jogadores as number,
          status: campeonato.status as string,
          createdAt: campeonato.created_at as string,
          totalDeInscritos: totalInscritos ?? 0,
          inscrito: !!inscricao,
        }
      })
    )

    return { status: 'sucesso', campeonatos: campeonatosProcessados }
  } catch (erro) {
    console.error('Erro inesperado ao buscar campeonatos:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao buscar campeonatos.' }
  }
}
