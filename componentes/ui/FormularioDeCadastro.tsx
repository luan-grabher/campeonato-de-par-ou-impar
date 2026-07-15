'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cadastrarUsuario } from '@/servidor/acoes/auth/cadastrarUsuario'
import InputTexto from './InputTexto'
import Botao from './Botao'
import styles from './FormularioDeCadastro.module.css'

export default function FormularioDeCadastro() {
  const router = useRouter()
  const [estado, acao, pendente] = useActionState(cadastrarUsuario, null)

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
