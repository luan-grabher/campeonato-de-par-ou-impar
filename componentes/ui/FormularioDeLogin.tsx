'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { chamarApi } from '@/hooks/usarApiCliente'
import InputTexto from './InputTexto'
import Botao from './Botao'
import styles from './FormularioDeLogin.module.css'

async function loginViaApi(_estadoAnterior: unknown, formData: FormData) {
  try {
    return await chamarApi<{ sucesso: boolean; erro?: string }>('/api/auth', {
      acao: 'login-email',
      email: formData.get('email'),
      senha: formData.get('senha'),
    })
  } catch (erro) {
    return {
      sucesso: false,
      erro: erro instanceof Error ? erro.message : 'Erro inesperado. Tente novamente.',
    }
  }
}

export default function FormularioDeLogin() {
  const router = useRouter()
  const [estado, acao, pendente] = useActionState(loginViaApi, null)

  useEffect(() => {
    if (estado?.sucesso) {
      router.push('/partida-rapida')
    }
  }, [estado, router])

  return (
    <form action={acao} className={styles.formulario}>
      <InputTexto
        label="Email"
        name="email"
        type="email"
        placeholder="seu@email.com"
        autoComplete="email"
        erro={estado?.erro && estado.erro.includes('email') ? estado.erro : undefined}
        required
      />

      <InputTexto
        label="Senha"
        name="senha"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        erro={estado?.erro && estado.erro.includes('senha') ? estado.erro : undefined}
        required
      />

      {estado?.erro && !estado.erro.includes('email') && !estado.erro.includes('senha') && (
        <p className={styles.erroGlobal} role="alert">
          {estado.erro}
        </p>
      )}

      <Botao type="submit" larguraTotal carregando={pendente}>
        Entrar
      </Botao>

      <p className={styles.link}>
        Não tem conta?{' '}
        <a href="/cadastro">Cadastre-se</a>
      </p>
    </form>
  )
}
