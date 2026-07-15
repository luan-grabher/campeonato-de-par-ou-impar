'use client'

import { useState, useEffect, useMemo } from 'react'
import styles from './EfeitoDeVitoria.module.css'

interface EfeitoDeVitoriaProps {
  venceu: boolean
  ativo: boolean
  onFim?: () => void
}

export default function EfeitoDeVitoria({
  venceu,
  ativo,
  onFim,
}: EfeitoDeVitoriaProps) {
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    if (!ativo) return

    setSaindo(false)
    const timer = setTimeout(() => {
      setSaindo(true)
      setTimeout(() => onFim?.(), 300)
    }, 2000)
    return () => clearTimeout(timer)
  }, [ativo, onFim])

  const particulas = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 400}ms`,
      })),
    []
  )

  if (!ativo) return null

  const overlayClasses = `${styles.overlay} ${saindo ? styles.saindo : ''}`

  return (
    <div className={overlayClasses} aria-live="polite">
      <div className={styles.conteudo}>
        <span className={`${styles.texto} ${venceu ? styles.vitoria : styles.derrota}`}>
          {venceu ? 'VITÓRIA' : 'DERROTA'}
        </span>
      </div>
      <div className={styles.particulas} aria-hidden="true">
        {particulas.map((p) => (
          <div
            key={p.id}
            className={styles.particula}
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.animationDelay,
            }}
          />
        ))}
      </div>
    </div>
  )
}
