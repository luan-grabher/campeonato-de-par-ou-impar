'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import { calcularElo } from '@/core/calculo/calcularElo'
import { K_FACTOR_PADRAO } from '@/core/constantes/pontuacao'

export type ResultadoDaSobrevivencia =
  | { status: 'eliminado'; mensagem: string }
  | { status: 'continuar'; mensagem: string }
  | { status: 'campeao'; mensagem: string; eloGanho: number; novoElo: number }
  | { status: 'erro'; mensagem: string }

export async function processarResultadoDaSobrevivencia(
  idDaPartida: string
): Promise<ResultadoDaSobrevivencia> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    const supabaseAdmin = criarClienteServidorAdmin()

    // Buscar partida
    const { data: partida } = await supabaseAdmin
      .from('partidas')
      .select('*')
      .eq('id', idDaPartida)
      .single()

    if (!partida) {
      return { status: 'erro', mensagem: 'Partida não encontrada.' }
    }

    if (partida.status !== 'finalizada') {
      return { status: 'erro', mensagem: 'Partida ainda não foi finalizada.' }
    }

    const vencedorId = partida.vencedor_id as string
    const perdedorId =
      vencedorId === partida.id_do_primeiro_jogador
        ? partida.id_do_segundo_jogador
        : partida.id_do_primeiro_jogador

    const usuarioEhVencedor = vencedorId === user.id

    if (usuarioEhVencedor) {
      // Vencedor: recolocar na fila de sobrevivência com +1 vitória consecutiva
      const { data: entradaAnterior } = await supabaseAdmin
        .from('fila_de_sobrevivencia')
        .select('vitorias_consecutivas')
        .eq('id_do_jogador', user.id)
        .maybeSingle()

      const vitoriasAtuais = (entradaAnterior?.vitorias_consecutivas as number) ?? 0

      // Reinserir na fila (pode ter sido deletado pela criação da partida)
      await supabaseAdmin.from('fila_de_sobrevivencia').upsert(
        {
          id_do_jogador: user.id,
          vitorias_consecutivas: vitoriasAtuais + 1,
        },
        { onConflict: 'id_do_jogador' }
      )

      // Verificar se é o único na fila — campeão!
      const { count: totalNaFila } = await supabaseAdmin
        .from('fila_de_sobrevivencia')
        .select('*', { count: 'exact', head: true })

      if (totalNaFila && totalNaFila <= 1) {
        // Último sobrevivente! É campeão!
        // Remover da fila
        await supabaseAdmin
          .from('fila_de_sobrevivencia')
          .delete()
          .eq('id_do_jogador', user.id)

        // Calcular Elo extra do campeonato
        const { data: perfil } = await supabaseAdmin
          .from('perfis')
          .select('elo')
          .eq('id_usuario', user.id)
          .single()

        const eloAtual = (perfil?.elo as number) ?? 1200
        const eloExtra = 50 + vitoriasAtuais * 10 // bônus por vitórias consecutivas
        const novoElo = eloAtual + eloExtra

        await supabaseAdmin
          .from('perfis')
          .update({ elo: novoElo })
          .eq('id_usuario', user.id)

        return {
          status: 'campeao',
          mensagem: `Você é o último sobrevivente! Ganhou ${eloExtra} de Elo extra!`,
          eloGanho: eloExtra,
          novoElo,
        }
      }

      return {
        status: 'continuar',
        mensagem: 'Você venceu! Volte para a fila para enfrentar o próximo oponente.',
      }
    }

    // Perdedor: eliminado
    return {
      status: 'eliminado',
      mensagem: 'Você foi eliminado do modo Sobrevivência.',
    }
  } catch (erro) {
    console.error('Erro ao processar resultado da sobrevivência:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao processar resultado.' }
  }
}
