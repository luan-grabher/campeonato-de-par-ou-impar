'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import { randomUUID } from 'crypto'

export interface IniciarPartidaResultado {
  idDaPartida: string
  totalDeRodadas: number
  anonimo: boolean
}

export async function iniciarPartidaContraIa(
  nomeDoJogador: string
): Promise<IniciarPartidaResultado> {
  const nomeNormalizado = nomeDoJogador.trim() || 'Jogador'

  if (nomeNormalizado.length > 20) {
    throw new Error('Nome muito longo. Use no máximo 20 caracteres.')
  }

  const id = randomUUID()
  const totalDeRodadas = 3

  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  const supabaseAdmin = criarClienteServidorAdmin()

  const { error: erroPartida } = await supabaseAdmin.from('partidas').insert({
    id,
    modo: 'classico',
    tipo: 'partida_contra_ia',
    id_do_primeiro_jogador: user?.id ?? null,
    id_do_segundo_jogador: null,
    status: 'em_andamento',
    total_de_rodadas_previsto: totalDeRodadas,
    rodada_atual: 1,
  })

  if (erroPartida) {
    console.error('Erro ao criar partida:', JSON.stringify(erroPartida, Object.getOwnPropertyNames(erroPartida)))
    throw new Error('Erro ao criar partida.')
  }

  const { error: erroRodada } = await supabaseAdmin.from('rodadas').insert({
    id_da_partida: id,
    numero_da_rodada: 1,
  })

  if (erroRodada) {
    console.error('Erro ao criar rodada:', erroRodada)
    await supabaseAdmin.from('partidas').delete().eq('id', id)
    throw new Error('Erro ao criar partida.')
  }

  return {
    idDaPartida: id,
    totalDeRodadas,
    anonimo: !user,
  }
}
