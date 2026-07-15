'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

export interface DadosDoConvite {
  id: string
  idDoRemetente: string
  nomeDoRemetente: string
  eloDoRemetente: number
  urlDoAvatarDoRemetente: string | null
  createdAt: string
}

export async function buscarConvitesPendentes(): Promise<DadosDoConvite[]> {
  const supabase = await criarClienteServidor()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Buscar convites pendentes recebidos
  const { data: convites } = await supabase
    .from('convites_de_amizade')
    .select('id, id_do_remetente, created_at')
    .eq('id_do_destinatario', user.id)
    .eq('status', 'pendente')
    .order('created_at', { ascending: false })

  if (!convites || convites.length === 0) {
    return []
  }

  const idsDosRemetentes = convites.map((c) => c.id_do_remetente as string)

  // Buscar perfis dos remetentes
  const { data: perfis } = await supabase
    .from('perfis')
    .select('id_usuario, nome, elo, url_do_avatar')
    .in('id_usuario', idsDosRemetentes)

  const mapaDePerfis = new Map<string, { nome: string; elo: number; urlDoAvatar: string | null }>()
  if (perfis) {
    for (const p of perfis) {
      mapaDePerfis.set(p.id_usuario as string, {
        nome: p.nome as string,
        elo: p.elo as number,
        urlDoAvatar: p.url_do_avatar as string | null,
      })
    }
  }

  return convites.map((convite) => {
    const perfil = mapaDePerfis.get(convite.id_do_remetente as string)
    return {
      id: convite.id as string,
      idDoRemetente: convite.id_do_remetente as string,
      nomeDoRemetente: perfil?.nome ?? 'Desconhecido',
      eloDoRemetente: perfil?.elo ?? 1200,
      urlDoAvatarDoRemetente: perfil?.urlDoAvatar ?? null,
      createdAt: convite.created_at as string,
    }
  })
}
