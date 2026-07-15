'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loginComEmail } from '@/servidor/acoes/auth/loginComEmail'
import InputTexto from './InputTexto'
import Botao from './Botao'
import styles from './FormularioDeLogin.module.css'

export default function FormularioDeLogin() {
  const router = useRouter()
  const [estado, acao, pendente] = useActionState(loginComEmail, null)

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
