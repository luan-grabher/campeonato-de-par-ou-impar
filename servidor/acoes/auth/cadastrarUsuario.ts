'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

interface ResultadoCadastro {
  sucesso: boolean
  erro?: string
}

const ERROS_SUPABASE_PT_BR: Record<string, string> = {
  'User already registered': 'Este email já está cadastrado.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Invalid email': 'Email inválido.',
  'Rate limit exceeded': 'Muitas tentativas. Aguarde um momento e tente novamente.',
  'Email not confirmed': 'Email não confirmado.',
  'Invalid login credentials': 'Email ou senha inválidos.',
  'Email not found': 'Este email não está cadastrado.',
}

function traduzirErroSupabase(mensagem: string): string {
  for (const [ingles, portugues] of Object.entries(ERROS_SUPABASE_PT_BR)) {
    if (mensagem.includes(ingles)) return portugues
  }
  return mensagem
}

export async function cadastrarUsuario(
  _estadoAnterior: ResultadoCadastro | null,
  formData: FormData
): Promise<ResultadoCadastro> {
  try {
    const email = formData.get('email') as string
    const senha = formData.get('senha') as string
    const confirmacaoSenha = formData.get('confirmacaoSenha') as string

    if (!email || !senha) {
      return { sucesso: false, erro: 'Email e senha são obrigatórios.' }
    }

    if (senha.length < 6) {
      return { sucesso: false, erro: 'A senha deve ter pelo menos 6 caracteres.' }
    }

    if (senha !== confirmacaoSenha) {
      return { sucesso: false, erro: 'As senhas não conferem.' }
    }

    // Criar usuário direto via admin — sem enviar email de confirmação
    const adminClient = criarClienteServidorAdmin()

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    })

    if (error) {
      return { sucesso: false, erro: traduzirErroSupabase(error.message) }
    }

    if (!data.user) {
      return { sucesso: false, erro: 'Erro inesperado ao criar conta. Tente novamente.' }
    }

    // Fazer login automático para criar a sessão nos cookies
    const supabase = await criarClienteServidor()
    const { error: erroLogin } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (erroLogin) {
      return { sucesso: false, erro: traduzirErroSupabase(erroLogin.message) }
    }

    return { sucesso: true }
  } catch (erro) {
    return {
      sucesso: false,
      erro:
        erro instanceof Error
          ? traduzirErroSupabase(erro.message)
          : 'Erro inesperado ao criar conta. Tente novamente.',
    }
  }
}
