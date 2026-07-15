import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import CabecalhoLogado from '@/componentes/layout/CabecalhoLogado'
import BarraDeNavegacao from '@/componentes/layout/BarraDeNavegacao'
import BannerDeTemporada from '@/componentes/jogo/BannerDeTemporada'
import Rodape from '@/componentes/layout/Rodape'
import type { ReactNode } from 'react'
import styles from './layout.module.css'

export default async function LayoutPainelLogado({
  children,
}: {
  children: ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options: Record<string, unknown>
          }>
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className={styles.wrapper}>
      <CabecalhoLogado />
      <div className={styles.corpo}>
        <BannerDeTemporada />
        <div className={styles.container}>
          <BarraDeNavegacao />
          <main className={styles.conteudo}>{children}</main>
        </div>
      </div>
      <Rodape />
    </div>
  )
}
