'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import { calcularElo } from '@/core/calculo/calcularElo'
import { avancarFaseDoCampeonato } from '@/servidor/acoes/avancarFaseDoCampeonato'

export interface ResultadoAtualizarElo {
  sucesso: boolean
  erro?: string
  eloGanho?: number
  eloPerdido?: number
  novoEloVencedor?: number
  novoEloPerdedor?: number
}

export async function atualizarEloAposPartida(
  idDoVencedor: string,
  idDoPerdedor: string,
  idDaPartida?: string
): Promise<ResultadoAtualizarElo> {
  try {
    const supabase = await criarClienteServidor()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, erro: 'Usuário não autenticado.' }
    }

    // Buscar elo atual de ambos os jogadores
    const { data: perfis } = await supabase
      .from('perfis')
      .select('id_usuario, elo')
      .in('id_usuario', [idDoVencedor, idDoPerdedor])

    const perfilVencedor = perfis?.find((p) => p.id_usuario === idDoVencedor)
    const perfilPerdedor = perfis?.find((p) => p.id_usuario === idDoPerdedor)

    if (!perfilVencedor || !perfilPerdedor) {
      return { sucesso: false, erro: 'Jogadores não encontrados.' }
    }

    const eloVencedor = perfilVencedor.elo as number
    const eloPerdedor = perfilPerdedor.elo as number

    // Calcular novo elo usando o core (fonte única da verdade)
    const { novoEloDoVencedor, novoEloDoPerdedor } = calcularElo(
      eloVencedor,
      eloPerdedor
    )

    // Atualizar no banco com cliente admin (bypass RLS)
    const supabaseAdmin = criarClienteServidorAdmin()

    await supabaseAdmin
      .from('perfis')
      .update({ elo: novoEloDoVencedor })
      .eq('id_usuario', idDoVencedor)

    await supabaseAdmin
      .from('perfis')
      .update({ elo: novoEloDoPerdedor })
      .eq('id_usuario', idDoPerdedor)

    // Se for partida de campeonato, avançar fase
    if (idDaPartida) {
      // Disparar e ignorar erro (não deve impedir a atualização de elo)
      avancarFaseDoCampeonato(idDaPartida).catch((erro) => {
        console.error('Erro ao avançar fase do campeonato:', erro)
      })
    }

    return {
      sucesso: true,
      eloGanho: novoEloDoVencedor - eloVencedor,
      eloPerdido: eloPerdedor - novoEloDoPerdedor,
      novoEloVencedor: novoEloDoVencedor,
      novoEloPerdedor: novoEloDoPerdedor,
    }
  } catch (erro) {
    console.error('Erro ao atualizar elo:', erro)
    return { sucesso: false, erro: 'Erro inesperado ao atualizar Elo.' }
  }
}
