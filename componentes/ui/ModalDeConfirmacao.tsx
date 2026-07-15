'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Botao from './Botao'
import styles from './ModalDeConfirmacao.module.css'

interface ModalDeConfirmacaoProps {
  aberto: boolean
  titulo: string
  descricao: string | ReactNode
  labelConfirmar?: string
  labelCancelar?: string
  varianteConfirmar?: 'primario' | 'perigo'
  carregando?: boolean
  onConfirmar: () => void
  onCancelar: () => void
  onFechar?: () => void
}

export default function ModalDeConfirmacao({
  aberto,
  titulo,
  descricao,
  labelConfirmar = 'Confirmar',
  labelCancelar = 'Cancelar',
  varianteConfirmar = 'primario',
  carregando = false,
  onConfirmar,
  onCancelar,
  onFechar,
}: ModalDeConfirmacaoProps) {
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    if (!aberto) {
      setSaindo(false)
    }
  }, [aberto])

  useEffect(() => {
    if (!aberto) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        lidarCancelar()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [aberto])

  function lidarFechar() {
    setSaindo(true)
    setTimeout(() => {
      setSaindo(false)
      onFechar?.()
      onCancelar()
    }, 200)
  }

  function lidarCancelar() {
    if (carregando) return
    lidarFechar()
  }

  if (!aberto && !saindo) return null

  const overlayClasses = `${styles.overlay} ${saindo ? styles.saindo : ''}`
  const cardClasses = `${styles.card} ${saindo ? styles.saindo : ''}`

  return (
    <div
      className={overlayClasses}
      onClick={lidarCancelar}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div className={cardClasses} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.titulo}>{titulo}</h2>
        <p className={styles.descricao}>{descricao}</p>
        <div className={styles.acoes}>
          <Botao
            variante="ghost"
            onClick={lidarCancelar}
            disabled={carregando}
          >
            {labelCancelar}
          </Botao>
          <Botao
            variante={varianteConfirmar}
            onClick={onConfirmar}
            carregando={carregando}
          >
            {labelConfirmar}
          </Botao>
        </div>
      </div>
    </div>
  )
}
