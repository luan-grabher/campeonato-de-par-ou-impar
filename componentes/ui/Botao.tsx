'use client'

import { type ButtonHTMLAttributes } from 'react'
import styles from './Botao.module.css'

type Variante = 'primario' | 'secundario' | 'ghost' | 'perigo'
type Tamanho = 'medio' | 'pequeno' | 'grande'

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamanho?: Tamanho
  carregando?: boolean
  larguraTotal?: boolean
}

export default function Botao({
  children,
  variante = 'primario',
  tamanho = 'medio',
  carregando = false,
  larguraTotal = false,
  disabled: desabilitado,
  className = '',
  ...props
}: BotaoProps) {
  const classes = [
    styles.botao,
    styles[variante],
    tamanho !== 'medio' ? styles[tamanho] : '',
    larguraTotal ? styles.larguraTotal : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      disabled={desabilitado || carregando}
      aria-busy={carregando}
      {...props}
    >
      {carregando && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}
