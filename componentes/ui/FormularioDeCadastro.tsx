'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { chamarApi } from '@/hooks/usarApiCliente'
import InputTexto from './InputTexto'
import Botao from './Botao'
import styles from './FormularioDeCadastro.module.css'

async function cadastrarViaApi(_estadoAnterior: unknown, formData: FormData) {
  try {
    return await chamarApi<{ sucesso: boolean; erro?: string }>('/api/auth', {
      acao: 'cadastrar',
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

export default function FormularioDeCadastro() {
  const router = useRouter()
  const [estado, acao, pendente] = useActionState(cadastrarViaApi, null)

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
        placeholder="No mínimo 6 caracteres"
        autoComplete="new-password"
        erro={estado?.erro && estado.erro.includes('senha') ? estado.erro : undefined}
        required
        minLength={6}
      />

      <InputTexto
        label="Confirmar senha"
        name="confirmacaoSenha"
        type="password"
        placeholder="Repita a senha"
        autoComplete="new-password"
        required
        minLength={6}
      />

      {estado?.erro && (
        <p className={styles.erroGlobal} role="alert">
          {typeof estado.erro === 'string'
            ? estado.erro
            : 'Erro inesperado. Tente novamente.'}
        </p>
      )}

      <Botao type="submit" larguraTotal carregando={pendente}>
        Criar conta
      </Botao>

      <p className={styles.link}>
        Já tem conta?{' '}
        <a href="/login">Faça login</a>
      </p>
    </form>
  )
}
