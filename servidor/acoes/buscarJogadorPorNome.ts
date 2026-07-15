'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

export interface ResultadoBuscaJogador {
  id: string
  nome: string
  elo: number
  urlDoAvatar: string | null
  jaEhAmigo: boolean
  convitePendenteEnviado: boolean
  convitePendenteRecebido: boolean
}

export async function buscarJogadorPorNome(
  nome: string
): Promise<ResultadoBuscaJogador[]> {
  try {
    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    if (!nome || nome.trim().length < 2) {
      return []
    }

    const termo = nome.trim()

    // Buscar jogadores com nome similar (case-insensitive)
    const { data: perfis } = await supabase
      .from('perfis')
      .select('id_usuario, nome, elo, url_do_avatar')
      .ilike('nome', `%${termo}%`)
      .neq('id_usuario', user.id)
      .limit(20)

    if (!perfis || perfis.length === 0) {
      return []
    }

    const idsEncontrados = perfis.map((p) => p.id_usuario as string)

    // Buscar amigos existentes
    const { data: amigos } = await supabase
      .from('amigos')
      .select('id_do_amigo')
      .eq('id_do_jogador', user.id)
      .in('id_do_amigo', idsEncontrados)

    const conjuntoAmigos = new Set((amigos ?? []).map((a) => a.id_do_amigo as string))

    // Buscar convites pendentes enviados
    const { data: convitesEnviados } = await supabase
      .from('convites_de_amizade')
      .select('id_do_destinatario')
      .eq('id_do_remetente', user.id)
      .eq('status', 'pendente')
      .in('id_do_destinatario', idsEncontrados)

    const conjuntoConvitesEnviados = new Set(
      (convitesEnviados ?? []).map((c) => c.id_do_destinatario as string)
    )

    // Buscar convites pendentes recebidos
    const { data: convitesRecebidos } = await supabase
      .from('convites_de_amizade')
      .select('id_do_remetente')
      .eq('id_do_destinatario', user.id)
      .eq('status', 'pendente')
      .in('id_do_remetente', idsEncontrados)

    const conjuntoConvitesRecebidos = new Set(
      (convitesRecebidos ?? []).map((c) => c.id_do_remetente as string)
    )

    return perfis.map((perfil) => ({
      id: perfil.id_usuario as string,
      nome: perfil.nome as string,
      elo: perfil.elo as number,
      urlDoAvatar: perfil.url_do_avatar as string | null,
      jaEhAmigo: conjuntoAmigos.has(perfil.id_usuario as string),
      convitePendenteEnviado: conjuntoConvitesEnviados.has(perfil.id_usuario as string),
      convitePendenteRecebido: conjuntoConvitesRecebidos.has(perfil.id_usuario as string),
    }))
  } catch (erro) {
    console.error('Erro ao buscar jogador por nome:', erro)
    return []
  }
}
