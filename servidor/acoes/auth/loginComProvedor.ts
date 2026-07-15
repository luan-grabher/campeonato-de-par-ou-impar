'use server'

import { redirect } from 'next/navigation'
import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

type ProvedorOAuth = 'google' | 'discord'

export async function loginComProvedor(provedor: ProvedorOAuth) {
  const supabase = await criarClienteServidor()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provedor,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirmar`,
    },
  })

  if (error || !data.url) {
    throw new Error(error?.message ?? 'Erro ao conectar com provedor OAuth.')
  }

  redirect(data.url)
}
