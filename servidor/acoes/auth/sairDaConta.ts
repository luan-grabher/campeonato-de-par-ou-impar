'use server'

import { redirect } from 'next/navigation'
import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

export async function sairDaConta() {
  const supabase = await criarClienteServidor()

  await supabase.auth.signOut()

  redirect('/login')
}
