'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import styles from './CronometroDaRodada.module.css'

interface CronometroDaRodadaProps {
  segundos: number
  emExecucao?: boolean
  onTempoEsgotado?: () => void
  className?: string
}

export default function CronometroDaRodada({
  segundos,
  emExecucao = true,
  onTempoEsgotado,
  className = '',
}: CronometroDaRodadaProps) {
  const [restante, setRestante] = useState(segundos)
  const [esgotado, setEsgotado] = useState(false)
  const callbackExecutado = useRef(false)
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onTempoEsgotadoRef = useRef(onTempoEsgotado)

  // Manter a ref sempre atualizada sem causar re-renders
  onTempoEsgotadoRef.current = onTempoEsgotado

  const parar = useCallback(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current)
      intervaloRef.current = null
    }
  }, [])

  useEffect(() => {
    setRestante(segundos)
    setEsgotado(false)
    callbackExecutado.current = false

    if (!emExecucao) {
      parar()
      return
    }

    intervaloRef.current = setInterval(() => {
      setRestante((prev) => {
        if (prev <= 1) {
          parar()
          if (!callbackExecutado.current) {
            callbackExecutado.current = true
            onTempoEsgotadoRef.current?.()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return parar
  }, [segundos, emExecucao])  // onTempoEsgotado removido — usamos ref pra evitar reset

  const progresso = segundos > 0 ? (restante / segundos) * 100 : 0
  const alerta = restante <= 3 && restante > 0

  return (
    <div className={`${styles.container} ${className}`}>
      <span className={`${styles.tempo} ${alerta ? styles.tempoAlerta : ''}`}>
        {restante}
      </span>
      <div className={styles.barraContainer}>
        <div
          className={`${styles.barra} ${alerta ? styles.barraAlerta : ''}`}
          style={{ width: `${progresso}%` }}
        />
      </div>
      <span className={styles.label}>
        {esgotado ? 'Tempo esgotado!' : alerta ? 'Últimos segundos!' : 'Tempo restante'}
      </span>
    </div>
  )
}
