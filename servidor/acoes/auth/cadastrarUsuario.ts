'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

interface ResultadoCadastro {
  sucesso: boolean
  erro?: string
}

export async function cadastrarUsuario(
  _estadoAnterior: ResultadoCadastro | null,
  formData: FormData
): Promise<ResultadoCadastro> {
  const email = formData.get('email') as string
  const senha = formData.get('senha') as string

  if (!email || !senha) {
    return { sucesso: false, erro: 'Email e senha são obrigatórios.' }
  }

  if (senha.length < 6) {
    return { sucesso: false, erro: 'A senha deve ter pelo menos 6 caracteres.' }
  }

  const supabase = await criarClienteServidor()

  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirmar`,
    },
  })

  if (error) {
    return { sucesso: false, erro: error.message }
  }

  return { sucesso: true }
}
