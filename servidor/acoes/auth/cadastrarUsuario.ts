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

function validarNome(nome: string): string | null {
  const trimmed = nome.trim()
  if (trimmed.length < 2 || trimmed.length > 24) {
    return 'O nome de usuário deve ter entre 2 e 24 caracteres.'
  }
  return null
}

export async function cadastrarUsuario(
  _estadoAnterior: ResultadoCadastro | null,
  formData: FormData
): Promise<ResultadoCadastro> {
  try {
    const email = formData.get('email') as string
    const senha = formData.get('senha') as string
    const confirmacaoSenha = formData.get('confirmacaoSenha') as string
    const nome = formData.get('nome') as string

    if (!email || !senha || !nome) {
      return { sucesso: false, erro: 'Email, senha e nome de usuário são obrigatórios.' }
    }

    if (senha.length < 6) {
      return { sucesso: false, erro: 'A senha deve ter pelo menos 6 caracteres.' }
    }

    if (senha !== confirmacaoSenha) {
      return { sucesso: false, erro: 'As senhas não conferem.' }
    }

    const erroNome = validarNome(nome)
    if (erroNome) return { sucesso: false, erro: erroNome }

    // Verificar se o nome de usuário já existe
    const adminClient = criarClienteServidorAdmin()
    const { data: perfisExistentes } = await adminClient
      .from('perfis')
      .select('id_usuario')
      .eq('nome', nome.trim())
      .maybeSingle()

    if (perfisExistentes) {
      return { sucesso: false, erro: 'Este nome de usuário já está em uso. Escolha outro.' }
    }

    // Criar usuário direto via admin — sem enviar email de confirmação
    // O nome de usuário vai no user_metadata para o trigger criar_perfil_ao_signup usar
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome_de_usuario: nome.trim(),
        apelido: nome.trim(),
      },
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
