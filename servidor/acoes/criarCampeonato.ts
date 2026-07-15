'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

interface EntradaCriarCampeonato {
  nome: string
  totalDeJogadores: 8 | 16 | 32 | 64
}

export type ResultadoCriarCampeonato =
  | { status: 'sucesso'; id: string }
  | { status: 'erro'; mensagem: string }

export async function criarCampeonato(
  entrada: EntradaCriarCampeonato
): Promise<ResultadoCriarCampeonato> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    if (!entrada.nome || entrada.nome.trim().length === 0) {
      return { status: 'erro', mensagem: 'O nome do campeonato é obrigatório.' }
    }

    const nomeNormalizado = entrada.nome.trim()

    if (nomeNormalizado.length > 100) {
      return { status: 'erro', mensagem: 'Nome muito longo. Use no máximo 100 caracteres.' }
    }

    if (![8, 16, 32, 64].includes(entrada.totalDeJogadores)) {
      return { status: 'erro', mensagem: 'Total de jogadores inválido. Use 8, 16, 32 ou 64.' }
    }

    const supabaseAdmin = criarClienteServidorAdmin()

    const { data: campeonato, error } = await supabaseAdmin
      .from('campeonatos')
      .insert({
        nome: nomeNormalizado,
        formato: 'mata_mata',
        total_de_jogadores: entrada.totalDeJogadores,
        status: 'inscricoes_abertas',
      })
      .select('id')
      .single()

    if (error || !campeonato) {
      console.error('Erro ao criar campeonato:', error)
      return { status: 'erro', mensagem: 'Erro ao criar campeonato. Tente novamente.' }
    }

    return { status: 'sucesso', id: campeonato.id as string }
  } catch (erro) {
    console.error('Erro inesperado ao criar campeonato:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao criar campeonato.' }
  }
}
