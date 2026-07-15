'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

export interface DadosDoAmigo {
  id: string
  nome: string
  elo: number
  urlDoAvatar: string | null
  online: boolean
}

export async function buscarListaDeAmigos(): Promise<DadosDoAmigo[]> {
  const supabase = await criarClienteServidor()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Buscar amigos onde o usuário é o jogador
  const { data: amigos } = await supabase
    .from('amigos')
    .select('id_do_amigo, created_at')
    .eq('id_do_jogador', user.id)

  if (!amigos || amigos.length === 0) {
    return []
  }

  const idsDosAmigos = amigos.map((a) => a.id_do_amigo as string)

  // Buscar perfis dos amigos
  const { data: perfis } = await supabase
    .from('perfis')
    .select('id_usuario, nome, elo, url_do_avatar, updated_at')
    .in('id_usuario', idsDosAmigos)

  if (!perfis) {
    return []
  }

  // Determinar online/offline pela última atualização (últimos 5 minutos)
  const limiteOnline = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const lista: DadosDoAmigo[] = perfis.map((perfil) => ({
    id: perfil.id_usuario as string,
    nome: perfil.nome as string,
    elo: perfil.elo as number,
    urlDoAvatar: perfil.url_do_avatar as string | null,
    online: (perfil.updated_at as string) >= limiteOnline,
  }))

  // Ordenar: online primeiro, depois por elo
  lista.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1
    return b.elo - a.elo
  })

  return lista
}
