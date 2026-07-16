'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

export async function definirParidadeDoDesempate(
  idDaPartida: string,
  paridadeEscolhida: 'par' | 'impar'
): Promise<{ status: 'paridade_definida' } | { status: 'erro'; mensagem: string }> {
  try {
    const supabase = await criarClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 'erro', mensagem: 'Não autenticado.' }

    const supabaseAdmin = criarClienteServidorAdmin()

    // Buscar partida e rodada atual
    const { data: partida } = await supabaseAdmin
      .from('partidas').select('*').eq('id', idDaPartida).single()
    if (!partida) return { status: 'erro', mensagem: 'Partida não encontrada.' }

    // Verificar se o jogador venceu a R1
    const { data: rodada1 } = await supabaseAdmin
      .from('rodadas').select('vencedor_id')
      .eq('id_da_partida', idDaPartida).eq('numero_da_rodada', 1).single()

    if (rodada1?.vencedor_id !== user.id) {
      return { status: 'erro', mensagem: 'Você não venceu a primeira rodada.' }
    }

    const rodadaAtual = partida.rodada_atual as number
    const paridadeOponente = paridadeEscolhida === 'par' ? 'impar' : 'par'

    // Determinar quem é o primeiro/segundo baseado em quem venceu R1
    const ehPrimeiro = partida.id_do_primeiro_jogador === user.id

    const paridadePrimeiro = ehPrimeiro ? paridadeEscolhida : paridadeOponente
    const paridadeSegundo = ehPrimeiro ? paridadeOponente : paridadeEscolhida

    const { error } = await supabaseAdmin
      .from('rodadas')
      .update({
        paridade_escolhida_pelo_primeiro: paridadePrimeiro,
        paridade_escolhida_pelo_segundo: paridadeSegundo,
      })
      .eq('id_da_partida', idDaPartida)
      .eq('numero_da_rodada', rodadaAtual)

    if (error) return { status: 'erro', mensagem: 'Erro ao definir paridade.' }

    // Broadcast
    const channel = supabaseAdmin.channel(`partida:${idDaPartida}`)
    await channel.send({
      type: 'broadcast',
      event: 'paridade_do_desempate_definida',
      payload: { numeroDaRodada: rodadaAtual },
    })

    return { status: 'paridade_definida' }
  } catch {
    return { status: 'erro', mensagem: 'Erro inesperado.' }
  }
}
