'use client'

import { useState, useEffect, useRef } from 'react'

interface UsarTimerRelampagoOptions {
  segundos: number
  emExecucao: boolean
  onTempoEsgotado: () => void
}

export function usarTimerRelampago({
  segundos,
  emExecucao,
  onTempoEsgotado,
}: UsarTimerRelampagoOptions) {
  const [restante, setRestante] = useState(segundos)
  const callbackExecutado = useRef(false)
  const onTempoEsgotadoRef = useRef(onTempoEsgotado)

  // Manter ref atualizada para evitar re-criação do efeito
  onTempoEsgotadoRef.current = onTempoEsgotado

  useEffect(() => {
    setRestante(segundos)
    callbackExecutado.current = false

    if (!emExecucao) return

    const intervalo = setInterval(() => {
      setRestante((prev) => {
        if (prev <= 1) {
          clearInterval(intervalo)
          if (!callbackExecutado.current) {
            callbackExecutado.current = true
            // Chamar callback de forma assíncrona para não bloquear o setState
            setTimeout(() => onTempoEsgotadoRef.current(), 0)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalo)
  }, [segundos, emExecucao])

  const alerta = restante <= 3 && restante > 0
  const progresso = segundos > 0 ? (restante / segundos) * 100 : 0

  return { restante, alerta, progresso }
}
