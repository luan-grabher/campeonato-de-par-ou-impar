'use client'

import { useState } from 'react'
import styles from './SeletorDeNumero.module.css'

interface SeletorDeNumeroProps {
  valorSelecionado?: number | null
  onChange?: (numero: number) => void
  desabilitado?: boolean
  maxNumeros?: number
  className?: string
}

export default function SeletorDeNumero({
  valorSelecionado,
  onChange,
  desabilitado = false,
  maxNumeros = 10,
  className = '',
}: SeletorDeNumeroProps) {
  const numeros = Array.from({ length: maxNumeros }, (_, i) => i + 1)

  function handleClick(numero: number) {
    if (desabilitado) return
    onChange?.(numero)
  }

  return (
    <div className={`${styles.grid} ${className}`}>
      {numeros.map((numero) => {
        const selecionado = valorSelecionado === numero
        const classes = [
          styles.numero,
          selecionado ? styles.selecionado : '',
          desabilitado ? styles.desabilitado : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={numero}
            className={classes}
            onClick={() => handleClick(numero)}
            disabled={desabilitado}
            aria-pressed={selecionado}
            aria-label={`Número ${numero}`}
          >
            {numero}
          </button>
        )
      })}
    </div>
  )
}
