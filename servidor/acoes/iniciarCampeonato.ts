'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

export type ResultadoIniciarCampeonato =
  | { status: 'sucesso' }
  | { status: 'erro'; mensagem: string }

interface JogadorNoChaveamento {
  idDoJogador: string
  posicao: number
}

/**
 * Embaralha um array usando Fisher-Yates
 */
function embaralhar<T>(array: T[]): T[] {
  const copia = [...array]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j]!, copia[i]!]
  }
  return copia
}

/**
 * Gera o chaveamento aleatório para mata-mata.
 * Distribui os jogadores em pares (A vs B, C vs D, etc.)
 */
function gerarChaveamento(jogadores: string[]): JogadorNoChaveamento[] {
  const embaralhado = embaralhar(jogadores)
  return embaralhado.map((idDoJogador, index) => ({
    idDoJogador,
    posicao: index + 1,
  }))
}

/**
 * Calcula o número de fases baseado no total de jogadores.
 * 8 → 3 fases, 16 → 4 fases, 32 → 5 fases, 64 → 6 fases
 */
function calcularNumeroDeFases(totalDeJogadores: number): number {
  return Math.log2(totalDeJogadores)
}

/**
 * Traduz o número da fase para nome amigável.
 */
function nomeDaFase(numeroDaFase: number, totalDeFases: number): string {
  // Fase 1 = oitavas (se 16+), fase 2 = quartas, fase 3 = semi, fase 4 = final
  const indicesDoFinal: Record<number, number> = { 3: 3, 4: 4, 5: 5, 6: 6 }
  const faseFinal = indicesDoFinal[totalDeFases] ?? totalDeFases

  if (numeroDaFase === faseFinal) return 'Final'
  if (numeroDaFase === faseFinal - 1) return 'Semifinal'
  if (numeroDaFase === faseFinal - 2) return 'Quartas de Final'
  if (numeroDaFase === faseFinal - 3) return 'Oitavas de Final'
  return `Fase ${numeroDaFase}`
}

export async function iniciarCampeonato(
  idDoCampeonato: string
): Promise<ResultadoIniciarCampeonato> {
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
      .select('id, status, total_de_jogadores')
      .eq('id', idDoCampeonato)
      .single()

    if (erroCampeonato || !campeonato) {
      return { status: 'erro', mensagem: 'Campeonato não encontrado.' }
    }

    if (campeonato.status !== 'inscricoes_abertas') {
      return { status: 'erro', mensagem: 'Campeonato já foi iniciado ou finalizado.' }
    }

    // Buscar participantes inscritos
    const { data: participantes } = await supabaseAdmin
      .from('participantes_do_campeonato')
      .select('id_do_jogador')
      .eq('id_do_campeonato', idDoCampeonato)

    if (!participantes || participantes.length === 0) {
      return { status: 'erro', mensagem: 'Nenhum jogador inscrito.' }
    }

    // Verificar se tem o número exato de jogadores
    if (participantes.length !== campeonato.total_de_jogadores) {
      return {
        status: 'erro',
        mensagem: `Número incorreto de participantes. Esperado ${campeonato.total_de_jogadores}, atual ${participantes.length}.`,
      }
    }

    const idsDosJogadores = participantes.map((p) => p.id_do_jogador as string)
    const chaveamento = gerarChaveamento(idsDosJogadores)
    const totalDeFases = calcularNumeroDeFases(campeonato.total_de_jogadores)
    const totalDePartidasNaPrimeiraFase = campeonato.total_de_jogadores / 2

    // Criar partidas da primeira fase
    const partidasParaInserir = []

    for (let i = 0; i < totalDePartidasNaPrimeiraFase; i++) {
      const jogadorA = chaveamento[i * 2]
      const jogadorB = chaveamento[i * 2 + 1]

      if (!jogadorA || !jogadorB) {
        return { status: 'erro', mensagem: 'Erro ao gerar chaveamento.' }
      }

      partidasParaInserir.push({
        modo: 'classico',
        tipo: 'campeonato',
        id_do_primeiro_jogador: jogadorA.idDoJogador,
        id_do_segundo_jogador: jogadorB.idDoJogador,
        id_do_campeonato: idDoCampeonato,
        status: 'aguardando_jogadores',
        total_de_rodadas_previsto: 3, // Melhor de 3
      })
    }

    const { error: erroPartidas } = await supabaseAdmin
      .from('partidas')
      .insert(partidasParaInserir)

    if (erroPartidas) {
      console.error('Erro ao criar partidas:', erroPartidas)
      return { status: 'erro', mensagem: 'Erro ao criar partidas do campeonato.' }
    }

    // Atualizar status do campeonato para 'em_andamento'
    const { error: erroAtualizar } = await supabaseAdmin
      .from('campeonatos')
      .update({ status: 'em_andamento' })
      .eq('id', idDoCampeonato)

    if (erroAtualizar) {
      console.error('Erro ao atualizar campeonato:', erroAtualizar)
      return { status: 'erro', mensagem: 'Erro ao iniciar campeonato.' }
    }

    return { status: 'sucesso' }
  } catch (erro) {
    console.error('Erro inesperado ao iniciar campeonato:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao iniciar campeonato.' }
  }
}
