'use client'

import { useEffect, useState } from 'react'
import { criarClienteNavegador } from '@/hooks/criarClienteNavegador'
import type { PerfilDoJogador } from '@/core/tipos/jogador'
import type { User } from '@supabase/supabase-js'

interface EstadoAutenticacao {
  jogador: PerfilDoJogador | null
  usuario: User | null
  carregando: boolean
}

export function usarJogadorAutenticado(): EstadoAutenticacao {
  const [estado, setEstado] = useState<EstadoAutenticacao>({
    jogador: null,
    usuario: null,
    carregando: true,
  })

  useEffect(() => {
    const supabase = criarClienteNavegador()

    async function carregarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        setEstado({ jogador: null, usuario: null, carregando: false })
        return
      }

      const usuario = session.user

      const { data: perfil } = await supabase
        .from('perfis')
        .select('*')
        .eq('id_usuario', usuario.id)
        .single()

      if (perfil) {
        const jogador: PerfilDoJogador = {
          id: perfil.id_usuario as string,
          nome: perfil.nome as string,
          email: usuario.email ?? null,
          pais: perfil.pais as string | null,
          urlDoAvatar: perfil.url_do_avatar as string | null,
          elo: perfil.elo as number,
          totalDeVitorias: perfil.total_de_vitorias as number,
          totalDeDerrotas: perfil.total_de_derrotas as number,
          totalDePartidas: perfil.total_de_partidas as number,
          sequenciaAtual: perfil.sequencia_atual as number,
          maiorSequencia: perfil.maior_sequencia as number,
          numeroFavorito: perfil.numero_favorito as number | null,
          moedas: perfil.moedas as number,
        }

        setEstado({ jogador, usuario, carregando: false })
      } else {
        setEstado({ jogador: null, usuario, carregando: false })
      }
    }

    carregarSessao()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_evento, session) => {
      if (!session?.user) {
        setEstado({ jogador: null, usuario: null, carregando: false })
        return
      }

      const usuario = session.user

      const { data: perfil } = await supabase
        .from('perfis')
        .select('*')
        .eq('id_usuario', usuario.id)
        .single()

      if (perfil) {
        const jogador: PerfilDoJogador = {
          id: perfil.id_usuario as string,
          nome: perfil.nome as string,
          email: usuario.email ?? null,
          pais: perfil.pais as string | null,
          urlDoAvatar: perfil.url_do_avatar as string | null,
          elo: perfil.elo as number,
          totalDeVitorias: perfil.total_de_vitorias as number,
          totalDeDerrotas: perfil.total_de_derrotas as number,
          totalDePartidas: perfil.total_de_partidas as number,
          sequenciaAtual: perfil.sequencia_atual as number,
          maiorSequencia: perfil.maior_sequencia as number,
          numeroFavorito: perfil.numero_favorito as number | null,
          moedas: perfil.moedas as number,
        }

        setEstado({ jogador, usuario, carregando: false })
      } else {
        setEstado({ jogador: null, usuario, carregando: false })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return estado
}
