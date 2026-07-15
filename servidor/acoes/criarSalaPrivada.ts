'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'
import type { ModoDeJogo } from '@/core/tipos/partida'

interface EntradaCriarSala {
  titulo: string
  totalDeRodadas: 3 | 5 | 7
  modoDeJogo: ModoDeJogo
}

export type ResultadoCriarSala =
  | { status: 'sucesso'; idDaSala: string; codigo: string }
  | { status: 'erro'; mensagem: string }

/** Gera um código alfanumérico único de 6 caracteres */
function gerarCodigoUnico(): string {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let codigo = ''
  for (let i = 0; i < 6; i++) {
    codigo += caracteres[Math.floor(Math.random() * caracteres.length)]
  }
  return codigo
}

export async function criarSalaPrivada(
  entrada: EntradaCriarSala
): Promise<ResultadoCriarSala> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: 'erro', mensagem: 'Usuário não autenticado.' }
    }

    if (!entrada.titulo || entrada.titulo.trim().length === 0) {
      return { status: 'erro', mensagem: 'O título da sala é obrigatório.' }
    }

    const tituloNormalizado = entrada.titulo.trim()

    if (tituloNormalizado.length > 50) {
      return { status: 'erro', mensagem: 'Título muito longo. Use no máximo 50 caracteres.' }
    }

    if (![3, 5, 7].includes(entrada.totalDeRodadas)) {
      return { status: 'erro', mensagem: 'Total de rodadas inválido.' }
    }

    const supabaseAdmin = criarClienteServidorAdmin()

    // Gerar código único (evitar colisão)
    let codigo: string
    let tentativas = 0
    const maxTentativas = 10

    do {
      codigo = gerarCodigoUnico()
      const { data: existente } = await supabaseAdmin
        .from('salas_privadas')
        .select('id')
        .eq('codigo', codigo)
        .maybeSingle()

      if (!existente) break
      tentativas++
    } while (tentativas < maxTentativas)

    if (tentativas >= maxTentativas) {
      return { status: 'erro', mensagem: 'Erro ao gerar código único. Tente novamente.' }
    }

    // Inserir sala
    const { data: sala, error: erroInsercao } = await supabaseAdmin
      .from('salas_privadas')
      .insert({
        codigo,
        titulo: tituloNormalizado,
        id_do_anfitriao: user.id,
        total_de_rodadas: entrada.totalDeRodadas,
        modo_de_jogo: entrada.modoDeJogo,
        status: 'aguardando_oponente',
      })
      .select('id')
      .single()

    if (erroInsercao || !sala) {
      console.error('Erro ao criar sala:', erroInsercao)
      return { status: 'erro', mensagem: 'Erro ao criar sala. Tente novamente.' }
    }

    return {
      status: 'sucesso',
      idDaSala: sala.id as string,
      codigo,
    }
  } catch (erro) {
    console.error('Erro inesperado ao criar sala:', erro)
    return { status: 'erro', mensagem: 'Erro inesperado ao criar sala.' }
  }
}
