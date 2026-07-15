'use client'

import { useEffect, useState } from 'react'
import styles from './ProgressoDaTemporada.module.css'

interface ProgressoDaTemporadaProps {
  dataDeInicio: string
  dataDeFim: string
}

export default function ProgressoDaTemporada({
  dataDeInicio,
  dataDeFim,
}: ProgressoDaTemporadaProps) {
  const [diasRestantes, setDiasRestantes] = useState<number>(0)
  const [progresso, setProgresso] = useState<number>(0)

  useEffect(() => {
    function calcular() {
      const agora = new Date()
      const inicio = new Date(dataDeInicio)
      const fim = new Date(dataDeFim)

      const totalMs = fim.getTime() - inicio.getTime()
      const passadoMs = agora.getTime() - inicio.getTime()
      const restanteMs = fim.getTime() - agora.getTime()

      if (totalMs <= 0) {
        setDiasRestantes(0)
        setProgresso(100)
        return
      }

      const pct = Math.max(0, Math.min(100, (passadoMs / totalMs) * 100))
      const dias = Math.max(0, Math.ceil(restanteMs / (1000 * 60 * 60 * 24)))

      setDiasRestantes(dias)
      setProgresso(pct)
    }

    calcular()

    const intervalo = setInterval(calcular, 60_000) // Atualizar a cada minuto
    return () => clearInterval(intervalo)
  }, [dataDeInicio, dataDeFim])

  if (diasRestantes <= 0) {
    return (
      <div className={styles.wrapper}>
        <span className={styles.encerrado}>Temporada encerrada</span>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.barraContainer}>
        <div
          className={styles.barra}
          style={{ width: `${Math.min(100, progresso)}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progresso)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className={styles.texto}>
        {diasRestantes} dia{diasRestantes > 1 ? 's' : ''} restantes
      </span>
    </div>
  )
}
