'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

/* ------------------------------------------------------------------ */
/*  Tipos                                                             */
/* ------------------------------------------------------------------ */

interface Jogador {
  id: string
  apelido: string
  avatar_url?: string
  elo: string
}

interface ContextoDeAutenticacao {
  jogador: Jogador | null
  carregando: boolean
  sair: () => Promise<void>
}

/* ------------------------------------------------------------------ */
/*  Contexto                                                          */
/* ------------------------------------------------------------------ */

const AutenticacaoContext = createContext<ContextoDeAutenticacao>({
  jogador: null,
  carregando: true,
  sair: async () => {},
})

export function useAutenticacao() {
  return useContext(AutenticacaoContext)
}

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

function criarJogadorDaSessao(
  sessao: import('@supabase/supabase-js').Session | null
): Jogador | null {
  if (!sessao?.user) return null

  return {
    id: sessao.user.id,
    apelido:
      sessao.user.user_metadata?.apelido ??
      sessao.user.user_metadata?.nome_de_usuario ??
      sessao.user.email?.split('@')[0] ??
      'Jogador',
    avatar_url: sessao.user.user_metadata?.avatar_url,
    elo: sessao.user.user_metadata?.elo ?? 'ferro',
  }
}

export default function ProvedorDeAutenticacao({
  children,
}: {
  children: ReactNode
}) {
  const [jogador, setJogador] = useState<Jogador | null>(null)
  const [carregando, setCarregando] = useState(true)
  const pathname = usePathname()

  const supabase = useMemo(
    () =>
      typeof window !== 'undefined'
        ? createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
          )
        : null,
    []
  )

  /* Sincroniza sessão com o Supabase */
  useEffect(() => {
    if (!supabase) {
      setCarregando(false)
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sessao) => {
      setJogador(criarJogadorDaSessao(sessao))
      setCarregando(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  /* Re-checa sessão ao navegar entre páginas */
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data: { session: sessao } }) => {
      setJogador(criarJogadorDaSessao(sessao))
      setCarregando(false)
    })
  }, [supabase, pathname])

  /* Actions */
  const sair = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setJogador(null)
    window.location.href = '/'
  }

  return (
    <AutenticacaoContext.Provider
      value={{ jogador, carregando, sair }}
    >
      {children}
    </AutenticacaoContext.Provider>
  )
}
