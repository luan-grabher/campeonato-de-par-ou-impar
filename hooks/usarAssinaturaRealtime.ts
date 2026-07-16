'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { criarClienteNavegador } from '@/hooks/criarClienteNavegador'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type EventoDaPartida =
  | {
      tipo: 'partida_encontrada'
      dados: {
        idDaPartida: string
        idDoPrimeiroJogador: string
        idDoSegundoJogador: string
      }
    }
  | {
      tipo: 'jogada_confirmada'
      dados: {
        idDoJogador: string
        numeroDaRodada: number
      }
    }
  | {
      tipo: 'resultado_da_rodada'
      dados: {
        numeroDaRodada: number
        somaDosNumeros: number
        paridadeResultante: 'par' | 'impar'
        vencedorId: string
        primeiroJogadorVenceu: boolean
        proximaRodada: number
        pontuacaoPrimeiro: number
        pontuacaoSegundo: number
      }
    }
  | {
      tipo: 'fim_da_partida'
      dados: {
        vencedorId: string
        eloGanho: number
        eloPerdido: number
        novoEloVencedor: number
        novoEloPerdedor: number
        pontuacaoPrimeiro: number
        pontuacaoSegundo: number
      }
    }

interface EstadoAssinatura {
  eventos: EventoDaPartida[]
  conectado: boolean
}

export function usarAssinaturaRealtime(
  idDaPartida: string | null,
  idDoJogador: string | null
): EstadoAssinatura {
  const [estado, setEstado] = useState<EstadoAssinatura>({
    eventos: [],
    conectado: false,
  })
  const canalRef = useRef<RealtimeChannel | null>(null)

  const lidarEvento = useCallback(
    (evento: EventoDaPartida) => {
      setEstado((prev) => ({
        ...prev,
        eventos: [...prev.eventos, evento],
      }))
    },
    []
  )

  useEffect(() => {
    if (!idDaPartida || !idDoJogador) {
      setEstado({ eventos: [], conectado: false })
      return
    }

    const supabase = criarClienteNavegador()

    const canal = supabase.channel(`partida:${idDaPartida}`, {
      config: {
        broadcast: {
          ack: true,
        },
      },
    })

    canalRef.current = canal

    // Escutar eventos de broadcast
    canal.on(
      'broadcast',
      { event: 'partida_encontrada' },
      (payload: { payload: EventoDaPartida['dados'] & { tipo?: string } }) => {
        lidarEvento({
          tipo: 'partida_encontrada',
          dados: payload.payload as EventoDaPartida['dados'] & {
            idDaPartida: string
            idDoPrimeiroJogador: string
            idDoSegundoJogador: string
          },
        })
      }
    )

    canal.on(
      'broadcast',
      { event: 'jogada_confirmada' },
      (payload: { payload: { idDoJogador: string; numeroDaRodada: number } }) => {
        lidarEvento({
          tipo: 'jogada_confirmada',
          dados: payload.payload,
        })
      }
    )

    canal.on(
      'broadcast',
      { event: 'resultado_da_rodada' },
      (payload: {
        payload: {
          numeroDaRodada: number
          somaDosNumeros: number
          paridadeResultante: 'par' | 'impar'
          vencedorId: string
          primeiroJogadorVenceu: boolean
          proximaRodada: number
          pontuacaoPrimeiro: number
          pontuacaoSegundo: number
        }
      }) => {
        lidarEvento({
          tipo: 'resultado_da_rodada',
          dados: payload.payload,
        })
      }
    )

    canal.on(
      'broadcast',
      { event: 'fim_da_partida' },
      (payload: {
        payload: {
          vencedorId: string
          eloGanho: number
          eloPerdido: number
          novoEloVencedor: number
          novoEloPerdedor: number
          pontuacaoPrimeiro: number
          pontuacaoSegundo: number
        }
      }) => {
        lidarEvento({
          tipo: 'fim_da_partida',
          dados: payload.payload,
        })
      }
    )

    canal.subscribe((status) => {
      setEstado((prev) => ({
        ...prev,
        conectado: status === 'SUBSCRIBED',
      }))
    })

    return () => {
      canal.unsubscribe()
      canalRef.current = null
      setEstado({ eventos: [], conectado: false })
    }
  }, [idDaPartida, idDoJogador, lidarEvento])

  return estado
}
