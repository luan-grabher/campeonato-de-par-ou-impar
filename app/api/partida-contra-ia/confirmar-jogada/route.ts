import { NextRequest, NextResponse } from 'next/server'
import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import { validarJogada } from '@/core/validacao/validarJogada'
import { gerarJogadaAleatoria } from '@/core/calculo/jogadaDaIaAleatoria'
import { calcularResultadoDaRodada } from '@/core/calculo/calcularResultadoDaRodada'
import { INTERVALO_EXPANDIDO } from '@/core/constantes/intervalosDeNumeros'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { idDaPartida, numeroDaRodada, numeroEscolhido, paridadeEscolhida } = body ?? {}

    if (!idDaPartida || typeof numeroDaRodada !== 'number' || typeof numeroEscolhido !== 'number' || !paridadeEscolhida) {
      return NextResponse.json({ erro: 'Parâmetros inválidos.' }, { status: 400 })
    }

    if (!['par', 'impar'].includes(paridadeEscolhida)) {
      return NextResponse.json({ erro: 'Paridade inválida.' }, { status: 400 })
    }

    const validacao = validarJogada({
      numeroEscolhido,
      intervalo: INTERVALO_EXPANDIDO,
      modo: 'classico',
    })
    if (!validacao.valida) {
      return NextResponse.json({ erro: validacao.erro ?? 'Jogada inválida.' }, { status: 400 })
    }

    // Verificar sessão
    const supabase = await criarClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    const supabaseAdmin = criarClienteServidorAdmin()

    // Buscar partida no banco
    const { data: partida, error: erroBusca } = await supabaseAdmin
      .from('partidas')
      .select('*')
      .eq('id', idDaPartida)
      .single()

    if (erroBusca || !partida) {
      return NextResponse.json({ erro: 'Partida não encontrada.' }, { status: 404 })
    }

    if (partida.status !== 'em_andamento') {
      return NextResponse.json({ erro: 'Partida não está em andamento.' }, { status: 400 })
    }

    // Validar acesso: se logado, só o dono joga; se anônimo, qualquer um pode
    const ehAnonimo = !partida.id_do_primeiro_jogador
    if (user && !ehAnonimo && partida.id_do_primeiro_jogador !== user.id) {
      return NextResponse.json({ erro: 'Você não faz parte desta partida.' }, { status: 403 })
    }

    if (partida.rodada_atual !== numeroDaRodada) {
      return NextResponse.json({ erro: `Rodada inválida. Esperada rodada ${partida.rodada_atual}.` }, { status: 400 })
    }

    // Buscar rodada atual
    const { data: rodada } = await supabaseAdmin
      .from('rodadas')
      .select('*')
      .eq('id_da_partida', idDaPartida)
      .eq('numero_da_rodada', numeroDaRodada)
      .single()

    if (!rodada) {
      return NextResponse.json({ erro: 'Rodada não encontrada.' }, { status: 404 })
    }

    if (rodada.jogada_do_primeiro_confirmada) {
      return NextResponse.json({ erro: 'Rodada já foi confirmada.' }, { status: 400 })
    }

    // Gerar jogada da IA
    const jogadaDaIa = gerarJogadaAleatoria(INTERVALO_EXPANDIDO)

    // Registrar jogada do jogador (sempre como "primeiro" — humano)
    await supabaseAdmin
      .from('rodadas')
      .update({
        numero_do_primeiro_jogador: numeroEscolhido,
        paridade_escolhida_pelo_primeiro: paridadeEscolhida,
        jogada_do_primeiro_confirmada: true,
        numero_do_segundo_jogador: jogadaDaIa.numero,
        paridade_escolhida_pelo_segundo: jogadaDaIa.paridade,
        jogada_do_segundo_confirmada: true,
      })
      .eq('id', rodada.id)

    // Calcular resultado com ambos os números
    const resultado = calcularResultadoDaRodada(
      numeroEscolhido,
      jogadaDaIa.numero,
      paridadeEscolhida
    )

    const vencedorId = resultado.primeiroJogadorVenceu
      ? partida.id_do_primeiro_jogador
      : null // IA venceu, sem ID

    // Atualizar rodada com resultado
    await supabaseAdmin
      .from('rodadas')
      .update({
        resultado_calculado: true,
        vencedor_id: vencedorId,
        soma_dos_numeros: resultado.somaDosNumeros,
        paridade_resultante: resultado.paridadeResultante,
      })
      .eq('id', rodada.id)

    // Buscar pontuação atual
    const { data: rodadasDaPartida } = await supabaseAdmin
      .from('rodadas')
      .select('vencedor_id')
      .eq('id_da_partida', idDaPartida)
      .eq('resultado_calculado', true)

    const pontuacaoDoJogador = (rodadasDaPartida ?? []).filter(r => r.vencedor_id).length
    const pontuacaoDaIa = (rodadasDaPartida ?? []).filter(r => !r.vencedor_id).length

    const totalRodadasPrevisto = (partida.total_de_rodadas_previsto as 1 | 3 | 5 | 7) ?? 3
    const vitoriasNecessarias = Math.ceil(totalRodadasPrevisto / 2)
    const partidaFinalizada =
      pontuacaoDoJogador >= vitoriasNecessarias || pontuacaoDaIa >= vitoriasNecessarias

    let vencedor: 'jogador' | 'ia' | null = null

    if (partidaFinalizada) {
      if (pontuacaoDoJogador > pontuacaoDaIa) vencedor = 'jogador'
      else if (pontuacaoDaIa > pontuacaoDoJogador) vencedor = 'ia'

      await supabaseAdmin
        .from('partidas')
        .update({
          status: 'finalizada',
          rodada_atual: numeroDaRodada,
          vencedor_id: vencedorId,
        })
        .eq('id', idDaPartida)

      // Partida anônima: deletar do banco após finalizar
      if (ehAnonimo) {
        await supabaseAdmin.from('rodadas').delete().eq('id_da_partida', idDaPartida)
        await supabaseAdmin.from('partidas').delete().eq('id', idDaPartida)
      }
    } else {
      const proximaRodada = numeroDaRodada + 1

      await supabaseAdmin
        .from('partidas')
        .update({ rodada_atual: proximaRodada })
        .eq('id', idDaPartida)

      await supabaseAdmin.from('rodadas').insert({
        id_da_partida: idDaPartida,
        numero_da_rodada: proximaRodada,
      })
    }

    return NextResponse.json({
      numeroDaRodada,
      numeroDoJogador: numeroEscolhido,
      paridadeDoJogador: paridadeEscolhida,
      numeroDaIa: jogadaDaIa.numero,
      paridadeDaIa: jogadaDaIa.paridade,
      resultado,
      pontuacaoDoJogador,
      pontuacaoDaIa,
      partidaFinalizada,
      vencedor,
    })
  } catch (erro) {
    console.error('Erro ao confirmar jogada contra IA:', erro)
    return NextResponse.json({ erro: 'Erro interno ao confirmar jogada.' }, { status: 500 })
  }
}
