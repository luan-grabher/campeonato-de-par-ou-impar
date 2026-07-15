'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'

interface ResultadoLogin {
  sucesso: boolean
  erro?: string
}

const ERROS_SUPABASE_PT_BR: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha inválidos.',
  'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
  'Email not found': 'Este email não está cadastrado.',
  'Invalid email': 'Email inválido.',
  'Rate limit exceeded': 'Muitas tentativas. Aguarde um momento e tente novamente.',
}

function traduzirErroSupabase(mensagem: string): string {
  for (const [ingles, portugues] of Object.entries(ERROS_SUPABASE_PT_BR)) {
    if (mensagem.includes(ingles)) return portugues
  }
  return mensagem
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
    return { sucesso: false, erro: traduzirErroSupabase(error.message) }
  }

  return { sucesso: true }
}
