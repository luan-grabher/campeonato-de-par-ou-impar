import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import CabecalhoAutenticavel from '@/componentes/layout/CabecalhoAutenticavel'
import Rodape from '@/componentes/layout/Rodape'
import type { ReactNode } from 'react'

export default async function LayoutPainelPublico({
  children,
}: {
  children: ReactNode
}) {
  let usuarioLogadoInicial = false

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Apenas leitura — sessão é gerenciada pelo cliente
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    usuarioLogadoInicial = !!user
  } catch {
    // Falha ao ler cookie — usuário não logado
  }

  return (
    <>
      <CabecalhoAutenticavel usuarioLogadoInicial={usuarioLogadoInicial} />
      <main className="conteudo-publico">{children}</main>
      <Rodape />
    </>
  )
}
