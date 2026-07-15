'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import TelaDeEspera from '@/componentes/jogo/TelaDeEspera'
import { entrarNaFilaDePartida } from '@/servidor/acoes/entrarNaFilaDePartida'
import { sairDaFilaDePartida } from '@/servidor/acoes/sairDaFilaDePartida'
import { usarJogadorAutenticado } from '@/hooks/usarJogadorAutenticado'
import styles from './page.module.css'

export default function PaginaFilaDePartida() {
  const router = useRouter()
  const { jogador } = usarJogadorAutenticado()
  const filaIniciadaRef = useRef(false)
  const redirecionouRef = useRef(false)

  const entrarNaFila = useCallback(async () => {
    if (filaIniciadaRef.current || redirecionouRef.current) return
    filaIniciadaRef.current = true

    const resultado = await entrarNaFilaDePartida()

    if (resultado.status === 'partida_encontrada') {
      redirecionouRef.current = true
      router.push(`/partida-rapida/jogo/${resultado.idDaPartida}`)
    }
    // Se 'na_fila', a página fica em espera enquanto o matchmaking roda
  }, [router])

  const lidarCancelar = useCallback(async () => {
    await sairDaFilaDePartida()
    router.push('/partida-rapida')
  }, [router])

  // Iniciar fila automaticamente
  useEffect(() => {
    if (!jogador || filaIniciadaRef.current) return

    entrarNaFila()

    // Polling: tentar matchmaking novamente a cada 3 segundos
    const intervalo = setInterval(async () => {
      if (redirecionouRef.current) return

      const resultado = await entrarNaFilaDePartida()

      if (resultado.status === 'partida_encontrada') {
        redirecionouRef.current = true
        clearInterval(intervalo)
        router.push(`/partida-rapida/jogo/${resultado.idDaPartida}`)
      }
    }, 3000)

    return () => clearInterval(intervalo)
  }, [jogador, entrarNaFila, router])

  return (
    <div className={styles.pagina}>
      <TelaDeEspera onCancelar={lidarCancelar} />
    </div>
  )
}
