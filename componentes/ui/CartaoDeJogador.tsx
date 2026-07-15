'use client'

import type { ReactNode } from 'react'
import styles from './CartaoDeJogador.module.css'

interface CartaoDeJogadorProps {
  nome: string
  elo?: ReactNode
  avatarUrl?: string
  className?: string
}

export default function CartaoDeJogador({
  nome,
  elo,
  avatarUrl,
  className = '',
}: CartaoDeJogadorProps) {
  const iniciais = nome
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={`${styles.cartao} ${className}`}>
      <div className={styles.avatar}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={nome} className={styles.avatarImagem} />
        ) : (
          <span>{iniciais}</span>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.nome}>{nome}</span>
        {elo && <div className={styles.elo}>{elo}</div>}
      </div>
    </div>
  )
}
