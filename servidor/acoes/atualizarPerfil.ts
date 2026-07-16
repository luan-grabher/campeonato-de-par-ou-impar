'use server'

import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { criarClienteServidorAdmin } from '@/servidor/integracoes/supabase/criarClienteServidorAdmin'

interface ResultadoAtualizacao {
  sucesso: boolean
  erro?: string
}

interface FormularioDeEdicao {
  nome: string
  pais: string
  urlDoAvatar: string
}

function validarNome(nome: string): string | null {
  const trimmed = nome.trim()
  if (trimmed.length < 2 || trimmed.length > 24) {
    return 'O nome deve ter entre 2 e 24 caracteres.'
  }
  return null
}

function validarPais(pais: string): string | null {
  if (!pais || pais.trim() === '') return null // pode ser vazio
  if (!/^[A-Za-z]{2}$/.test(pais.trim())) {
    return 'O país deve ser um código ISO de 2 letras.'
  }
  return null
}

function validarUrlDoAvatar(url: string): string | null {
  if (!url || url.trim() === '') return null // pode ser vazio
  try {
    new URL(url.trim())
  } catch {
    return 'A URL do avatar é inválida.'
  }
  return null
}

export async function atualizarPerfil(
  _estadoAnterior: ResultadoAtualizacao | null,
  formData: FormData
): Promise<ResultadoAtualizacao> {
  try {
    const nome = (formData.get('nome') as string) ?? ''
    const pais = (formData.get('pais') as string) ?? ''
    const urlDoAvatar = (formData.get('urlDoAvatar') as string) ?? ''

    // Validações
    const erroNome = validarNome(nome)
    if (erroNome) return { sucesso: false, erro: erroNome }

    const paisTrimmed = pais.trim()
    const erroPais = validarPais(paisTrimmed)
    if (erroPais) return { sucesso: false, erro: erroPais }

    const urlTrimmed = urlDoAvatar.trim()
    const erroUrl = validarUrlDoAvatar(urlTrimmed)
    if (erroUrl) return { sucesso: false, erro: erroUrl }

    const supabase = await criarClienteServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, erro: 'Usuário não autenticado.' }
    }

    const nomeTrimmed = nome.trim()

    // Verifica se o nome já está em uso por OUTRO usuário
    const { data: conflito } = await supabase
      .from('perfis')
      .select('id_usuario')
      .eq('nome', nomeTrimmed)
      .neq('id_usuario', user.id)
      .maybeSingle()

    if (conflito) {
      return { sucesso: false, erro: 'Este nome de usuário já está em uso. Escolha outro.' }
    }

    const dadosAtualizacao: Record<string, string | null> = {
      nome: nomeTrimmed,
    }

    if (paisTrimmed) {
      dadosAtualizacao.pais = paisTrimmed.toUpperCase()
    } else {
      dadosAtualizacao.pais = null
    }

    if (urlTrimmed) {
      dadosAtualizacao.url_do_avatar = urlTrimmed
    } else {
      dadosAtualizacao.url_do_avatar = null
    }

    const { error } = await supabase
      .from('perfis')
      .update(dadosAtualizacao)
      .eq('id_usuario', user.id)

    if (error) {
      // Unique constraint violation (outra race condition)
      if (error.code === '23505') {
        return { sucesso: false, erro: 'Este nome de usuário já está em uso. Escolha outro.' }
      }
      console.error('Erro ao atualizar perfil:', error)
      return { sucesso: false, erro: 'Erro ao salvar as alterações.' }
    }

    // Sincronizar user_metadata do Auth para o header refletir o novo nome
    if (nomeTrimmed !== user.user_metadata?.apelido) {
      const adminClient = criarClienteServidorAdmin()
      const { error: erroMetadata } = await adminClient.auth.admin.updateUserById(
        user.id,
        { user_metadata: { ...user.user_metadata, apelido: nomeTrimmed, nome_de_usuario: nomeTrimmed } }
      )
      if (erroMetadata) {
        console.error('Erro ao sincronizar user_metadata:', erroMetadata)
      }
    }

    return { sucesso: true }
  } catch (erro) {
    console.error('Erro ao atualizar perfil:', erro)
    return { sucesso: false, erro: 'Erro inesperado ao atualizar perfil.' }
  }
}