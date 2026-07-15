'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import type { Temporada } from '@/supabase/tipos.gen'

export interface ResultadoIniciarTemporada {
  sucesso: boolean
  temporada: Temporada | null
  erro?: string
}

interface PerfilComElo {
  id_usuario: string
  elo: number
}

/**
 * Cria uma nova temporada e aplica reset parcial de Elo em todos os perfis.
 *
 * O reset parcial segue a fórmula:
 *   (EloAtual - eloInicial) * 0.5 + eloInicial
 *
 * Isso garante que jogadores mantenham metade do progreso da temporada anterior.
 */
export async function iniciarTemporada(
  nome: string,
  dataDeFim: string,
  eloInicial: number = 1200
): Promise<ResultadoIniciarTemporada> {
  try {
    const supabase = await criarClienteServidor()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, temporada: null, erro: 'Usuário não autenticado.' }
    }

    // Verificar se já existe uma temporada ativa
    const { data: temporadaAtiva } = await supabase
      .from('temporadas')
      .select('id')
      .eq('status', 'ativa')
      .limit(1)
      .maybeSingle()

    if (temporadaAtiva) {
      return {
        sucesso: false,
        temporada: null,
        erro: 'Já existe uma temporada ativa. Finalize-a antes de iniciar uma nova.',
      }
    }

    const dataDeInicio = new Date().toISOString()
    const supabaseAdmin = criarClienteServidorAdmin()

    // Aplicar reset parcial de Elo em TODOS os perfis
    const { data: perfis } = await supabaseAdmin
      .from('perfis')
      .select('id_usuario, elo')
      .returns<PerfilComElo[]>()

    if (perfis && perfis.length > 0) {
      for (const perfil of perfis) {
        const novoElo = Math.max(
          0,
          Math.round((perfil.elo - eloInicial) * 0.5 + eloInicial)
        )

        await supabaseAdmin
          .from('perfis')
          .update({ elo: novoElo })
          .eq('id_usuario', perfil.id_usuario)
      }
    }

    // Criar a nova temporada
    const { data, error } = await supabaseAdmin
      .from('temporadas')
      .insert({
        nome,
        data_de_inicio: dataDeInicio,
        data_de_fim: dataDeFim,
        elo_inicial: eloInicial,
        status: 'ativa',
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar temporada:', error)
      return { sucesso: false, temporada: null, erro: 'Erro ao criar temporada.' }
    }

    return { sucesso: true, temporada: data }
  } catch (erro) {
    console.error('Erro inesperado ao iniciar temporada:', erro)
    return { sucesso: false, temporada: null, erro: 'Erro inesperado ao iniciar temporada.' }
  }
}
