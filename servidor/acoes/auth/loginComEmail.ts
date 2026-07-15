'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

interface ResultadoLogin {
  sucesso: boolean
  erro?: string
}

export async function loginComEmail(
  _estadoAnterior: ResultadoLogin | null,
  formData: FormData
): Promise<ResultadoLogin> {
  const email = formData.get('email') as string
  const senha = formData.get('senha') as string

  if (!email || !senha) {
    return { sucesso: false, erro: 'Email e senha são obrigatórios.' }
  }

  const supabase = await criarClienteServidor()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  })

  if (error) {
    return { sucesso: false, erro: error.message }
  }

  return { sucesso: true }
}
