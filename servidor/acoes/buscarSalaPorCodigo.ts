'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import type { ModoDeJogo } from '@/core/tipos/partida'

interface DadosDaSala {
  id: string
  codigo: string
  titulo: string
  idDoAnfitriao: string
  totalDeRodadas: 3 | 5 | 7
  modoDeJogo: ModoDeJogo
  status: 'aguardando_oponente' | 'em_andamento' | 'finalizada' | 'cancelada'
  criadaEm: string
}

export type ResultadoBuscarSala =
  | { status: 'sucesso'; sala: DadosDaSala }
  | { status: 'erro'; mensagem: string }

export async function buscarSalaPorCodigo(
  codigo: string
): Promise<ResultadoBuscarSala> {
  try {
    if (!codigo || codigo.trim().length === 0) {
      return { status: 'erro', mensagem: 'Código inválido.' }
    }

    const supabase = await criarClienteServidor()

    const codigoNormalizado = codigo.trim().toUpperCase()

    const { data: sala, error } = await supabase
      .from('salas_privadas')
      .select('*')
      .eq('codigo', codigoNormalizado)
      .single()

    if (error || !sala) {
      return { status: 'erro', mensagem: 'Sala não encontrada.' }
    }

    return {
      status: 'sucesso',
      sala: {
        id: sala.id as string,
        codigo: sala.codigo as string,
        titulo: sala.titulo as string,
        idDoAnfitriao: sala.id_do_anfitriao as string,
        totalDeRodadas: sala.total_de_rodadas as 3 | 5 | 7,
        modoDeJogo: sala.modo_de_jogo as ModoDeJogo,
        status: sala.status as DadosDaSala['status'],
        criadaEm: sala.created_at as string,
      },
    }
  } catch (erro) {
    console.error('Erro ao buscar sala:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao buscar sala.' }
  }
}
