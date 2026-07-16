import { NextRequest, NextResponse } from 'next/server'
import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import { validarJogada } from '@/core/validacao/validarJogada'
import { gerarJogadaAleatoria } from '@/core/calculo/jogadaDaIaAleatoria'
import { calcularResultadoDaRodada } from '@/core/calculo/calcularResultadoDaRodada'
import { atribuirParidadeDaRodada } from '@/core/calculo/atribuirParidade'
import { INTERVALO_EXPANDIDO } from '@/core/constantes/intervalosDeNumeros'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { idDaPartida, numeroDaRodada, numeroEscolhido } = body ?? {}

    if (
      !idDaPartida ||
      typeof numeroDaRodada !== 'number' ||
      typeof numeroEscolhido !== 'number'
    ) {
      return NextResponse.json({ erro: 'Par\u00e2metros inv\u00e1lidos.' }, { status: 400 })
    }

    const validacao = validarJogada({
      numeroEscolhido,
      intervalo: INTERVALO_EXPANDIDO,
      modo: 'classico',
    })
    if (!validacao.valida) {
      return NextResponse.json({ erro: validacao.erro ?? 'Jogada inv\u00e1lida.' }, { status: 400 })
    }

    // Verificar sess\u00e3o
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
      return NextResponse.json({ erro: 'Partida n\u00e3o encontrada.' }, { status: 404 })
    }

    if (partida.status !== 'em_andamento') {
      return NextResponse.json({ erro: 'Partida n\u00e3o est\u00e1 em andamento.' }, { status: 400 })
    }

    // Validar acesso: se logado, s\u00f3 o dono joga; se an\u00f4nimo, qualquer um pode
    const ehAnonimo = !partida.id_do_primeiro_jogador
    if (user && !ehAnonimo && partida.id_do_primeiro_jogador !== user.id) {
      return NextResponse.json({ erro: 'Voc\u00ea n\u00e3o faz parte desta partida.' }, { status: 403 })
    }

    if (partida.rodada_atual !== numeroDaRodada) {
      return NextResponse.json({ erro: 'Rodada inv\u00e1lida. Esperada rodada ' + partida.rodada_atual + '.' }, { status: 400 })
    }

    // Buscar rodada atual
    const { data: rodada } = await supabaseAdmin
      .from('rodadas')
      .select('*')
      .eq('id_da_partida', idDaPartida)
      .eq('numero_da_rodada', numeroDaRodada)
      .single()

    if (!rodada) {
      return NextResponse.json({ erro: 'Rodada n\u00e3o encontrada.' }, { status: 404 })
    }

    if (rodada.jogada_do_primeiro_confirmada) {
      return NextResponse.json({ erro: 'Rodada j\u00e1 foi confirmada.' }, { status: 400 })
    }

    // Determinar paridade via atribuirParidadeDaRodada
    const paridadeInicialDoPrimeiro: 'par' | 'impar' =
      (partida.paridade_inicial_do_primeiro as 'par' | 'impar') ?? 'par'
    const totalDeRodadas = (partida.total_de_rodadas_previsto as number) ?? 3

    const atribuicao = atribuirParidadeDaRodada(
      numeroDaRodada,
      paridadeInicialDoPrimeiro,
      totalDeRodadas
    )

    if ('desempate' in atribuicao) {
      // Buscar resultado da primeira rodada para decidir vantagem
      const { data: primeiraRodada } = await supabaseAdmin
        .from('rodadas')
        .select('vencedor_id')
        .eq('id_da_partida', idDaPartida)
        .eq('numero_da_rodada', 1)
        .single()

      const jogadorVenceuPrimeiraRodada =
        primeiraRodada?.vencedor_id === partida.id_do_primeiro_jogador

      if (jogadorVenceuPrimeiraRodada) {
        // Jogador venceu R1 -> frontend escolhe paridade
        // Salvar n\u00famero do jogador sem confirmar rodada
        await supabaseAdmin
          .from('rodadas')
          .update({
            numero_do_primeiro_jogador: numeroEscolhido,
          })
          .eq('id', rodada.id)

        return NextResponse.json({
          numeroDaRodada,
          numeroDoJogador: numeroEscolhido,
          paridadeDoJogador: null,
          numeroDaIa: null,
          paridadeDaIa: null,
          resultado: null,
          pontuacaoDoJogador: 0,
          pontuacaoDaIa: 0,
          partidaFinalizada: false,
          vencedor: null,
          desempate: true,
        })
      }

      // IA venceu R1 -> IA escolhe paridade aleatoriamente
      const paridadeDaIa: 'par' | 'impar' = Math.random() < 0.5 ? 'par' : 'impar'
      const paridadeDoJogador: 'par' | 'impar' = paridadeDaIa === 'par' ? 'impar' : 'par'

      // Gerar jogada da IA
      const jogadaDaIa = gerarJogadaAleatoria(INTERVALO_EXPANDIDO)

      // Registrar jogada completa
      await supabaseAdmin
        .from('rodadas')
        .update({
          numero_do_primeiro_jogador: numeroEscolhido,
          paridade_escolhida_pelo_primeiro: paridadeDoJogador,
          jogada_do_primeiro_confirmada: true,
          numero_do_segundo_jogador: jogadaDaIa.numero,
          paridade_escolhida_pelo_segundo: paridadeDaIa,
          jogada_do_segundo_confirmada: true,
        })
        .eq('id', rodada.id)

      // Calcular resultado
      const resultado = calcularResultadoDaRodada(
        numeroEscolhido,
        jogadaDaIa.numero,
        paridadeDoJogador
      )

      const vencedorId = resultado.primeiroJogadorVenceu
        ? partida.id_do_primeiro_jogador
        : null

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

      // Calcular pontua\u00e7\u00e3o e finalizar
      const { data: rodadasDaPartida } = await supabaseAdmin
        .from('rodadas')
        .select('vencedor_id')
        .eq('id_da_partida', idDaPartida)
        .eq('resultado_calculado', true)

      const pontuacaoDoJogador = (rodadasDaPartida ?? []).filter(r => r.vencedor_id).length
      const pontuacaoDaIa = (rodadasDaPartida ?? []).filter(r => !r.vencedor_id).length

      const vitoriasNecessarias = Math.ceil(totalDeRodadas / 2)
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
        paridadeDoJogador,
        numeroDaIa: jogadaDaIa.numero,
        paridadeDaIa,
        resultado,
        pontuacaoDoJogador,
        pontuacaoDaIa,
        partidaFinalizada,
        vencedor,
      })
    }

    // Caso normal (n\u00e3o desempate): paridades determinadas pela rodada
    const paridadeDoJogador: 'par' | 'impar' = atribuicao.paridadeDoPrimeiro
    const paridadeDaIa: 'par' | 'impar' = atribuicao.paridadeDoSegundo

    // Gerar jogada da IA
    const jogadaDaIa = gerarJogadaAleatoria(INTERVALO_EXPANDIDO)

    // Registrar jogada do jogador (sempre como "primeiro" - humano)
    await supabaseAdmin
      .from('rodadas')
      .update({
        numero_do_primeiro_jogador: numeroEscolhido,
        paridade_escolhida_pelo_primeiro: paridadeDoJogador,
        jogada_do_primeiro_confirmada: true,
        numero_do_segundo_jogador: jogadaDaIa.numero,
        paridade_escolhida_pelo_segundo: paridadeDaIa,
        jogada_do_segundo_confirmada: true,
      })
      .eq('id', rodada.id)

    // Calcular resultado com ambos os n\u00fameros
    const resultado = calcularResultadoDaRodada(
      numeroEscolhido,
      jogadaDaIa.numero,
      paridadeDoJogador
    )

    const vencedorId = resultado.primeiroJogadorVenceu
      ? partida.id_do_primeiro_jogador
      : null

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

    // Buscar pontua\u00e7\u00e3o atual
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
      paridadeDoJogador,
      numeroDaIa: jogadaDaIa.numero,
      paridadeDaIa,
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
