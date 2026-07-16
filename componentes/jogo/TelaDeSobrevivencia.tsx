'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Skull, Trophy, Swords, Users } from 'lucide-react'
import { chamarApi } from '@/hooks/usarApiCliente'
import { criarClienteNavegador } from '@/hooks/criarClienteNavegador'
import styles from './TelaDeSobrevivencia.module.css'

interface TelaDeSobrevivenciaProps {
  idDoJogador: string
}

type EstadoDaSobrevivencia =
  | { tipo: 'menu' }
  | { tipo: 'na_fila' }
  | { tipo: 'buscando_partida' }
  | { tipo: 'eliminado' }
  | { tipo: 'campeao'; mensagem: string; eloGanho: number }

export default function TelaDeSobrevivencia({ idDoJogador }: TelaDeSobrevivenciaProps) {
  const router = useRouter()
  const [estado, setEstado] = useState<EstadoDaSobrevivencia>({ tipo: 'menu' })
  const [totalJogadores, setTotalJogadores] = useState(0)
  const filaIniciadaRef = useRef(false)
  const redirecionouRef = useRef(false)
  const [carregando, setCarregando] = useState(false)

  const entrarNaFila = useCallback(async () => {
    if (filaIniciadaRef.current || redirecionouRef.current) return
    filaIniciadaRef.current = true
    setCarregando(true)

    setEstado({ tipo: 'buscando_partida' })

    const resultado = await chamarApi<{ status: string; idDaPartida?: string; mensagem?: string }>(
      '/api/sobrevivencia',
      { acao: 'entrar' }
    )

    setCarregando(false)

    if (resultado.status === 'partida_encontrada') {
      redirecionouRef.current = true
      router.push(`/partida-rapida/jogo/${resultado.idDaPartida}`)
    } else if (resultado.status === 'na_fila') {
      setEstado({ tipo: 'na_fila' })
    } else if (resultado.status === 'erro') {
      filaIniciadaRef.current = false
      setEstado({ tipo: 'menu' })
    }
  }, [router])

  const lidarCancelar = useCallback(async () => {
    await chamarApi('/api/sobrevivencia', { acao: 'sair' })
    filaIniciadaRef.current = false
    setEstado({ tipo: 'menu' })
  }, [])

  // Polling enquanto estiver na fila
  useEffect(() => {
    if (estado.tipo !== 'na_fila') return

      const intervalo = setInterval(async () => {
      if (redirecionouRef.current) return

      const resultado = await chamarApi<{ status: string; idDaPartida?: string; mensagem?: string }>(
        '/api/sobrevivencia',
        { acao: 'entrar' }
      )

      if (resultado.status === 'partida_encontrada') {
        redirecionouRef.current = true
        clearInterval(intervalo)
        router.push(`/partida-rapida/jogo/${resultado.idDaPartida}`)
      } else if (resultado.status === 'sobrevivente_unico') {
        clearInterval(intervalo)
        setEstado({
          tipo: 'campeao',
          mensagem: resultado.mensagem ?? 'Nenhum oponente disponível.',
          eloGanho: 0,
        })
      }
      // Se 'na_fila', continua aguardando
    }, 3000)

    return () => clearInterval(intervalo)
  }, [estado.tipo, router])

  // Buscar total de jogadores na fila
  useEffect(() => {
    async function buscarTotal() {
      try {
        const supabase = criarClienteNavegador()
        const { count } = await supabase
          .from('fila_de_sobrevivencia')
          .select('*', { count: 'exact', head: true })
        setTotalJogadores(count ?? 0)
      } catch {
        // Ignorar erros de busca
      }
    }

    buscarTotal()
    const intervalo = setInterval(buscarTotal, 5000)
    return () => clearInterval(intervalo)
  }, [])

  if (estado.tipo === 'eliminado') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <Skull size={64} className={styles.iconeEliminado} />
          <h1 className={styles.tituloEliminado}>Eliminado!</h1>
          <p className={styles.descricao}>
            Você foi eliminado do modo Sobrevivência.
          </p>
          <p className={styles.subtitulo}>
            Não desista! Volte para a fila e tente novamente.
          </p>
          <button
            className={styles.botaoPrimario}
            onClick={() => {
              filaIniciadaRef.current = false
              redirecionouRef.current = false
              setEstado({ tipo: 'menu' })
            }}
          >
            <Swords size={18} />
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (estado.tipo === 'campeao') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <Trophy size={64} className={styles.iconeCampeao} />
          <h1 className={styles.tituloCampeao}>Campeão!</h1>
          <p className={styles.descricao}>
            {estado.mensagem}
          </p>
          {estado.eloGanho > 0 && (
            <p className={styles.eloExtra}>
              +{estado.eloGanho} Elo extra!
            </p>
          )}
          <button
            className={styles.botaoPrimario}
            onClick={() => {
              filaIniciadaRef.current = false
              redirecionouRef.current = false
              setEstado({ tipo: 'menu' })
            }}
          >
            <Swords size={18} />
            Jogar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (estado.tipo === 'na_fila' || estado.tipo === 'buscando_partida') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.animacao}>
            <Swords size={48} className={styles.iconePulsante} />
          </div>

          <h2 className={styles.titulo}>
            {estado.tipo === 'buscando_partida' ? 'Procurando oponente...' : 'Na fila...'}
          </h2>

          <p className={styles.subtitulo}>
            {estado.tipo === 'buscando_partida'
              ? 'Aguardando enquanto encontramos um oponente.'
              : 'Você está na fila de sobrevivência. Quando encontrarmos um oponente, a partida começará.'}
          </p>

          <div className={styles.totalContainer}>
            <Users size={16} />
            <span>{totalJogadores} jogador(es) na fila</span>
          </div>

          {estado.tipo === 'na_fila' && (
            <div className={styles.pontinhos}>
              <span className={styles.ponto} />
              <span className={styles.ponto} />
              <span className={styles.ponto} />
            </div>
          )}

          {estado.tipo === 'buscando_partida' && carregando && (
            <div className={styles.pontinhos}>
              <span className={styles.ponto} />
              <span className={styles.ponto} />
              <span className={styles.ponto} />
            </div>
          )}

          <button
            className={styles.botaoCancelar}
            onClick={lidarCancelar}
            disabled={carregando}
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  // Menu principal
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Swords size={48} className={styles.icone} />

        <h1 className={styles.titulo}>Modo Sobrevivência</h1>

        <p className={styles.descricao}>
          Enfrente oponentes um por um. Quem perde é eliminado.
          O último sobrevivente vence e ganha Elo extra!
        </p>

        <div className={styles.infoContainer}>
          <div className={styles.infoItem}>
            <Trophy size={20} className={styles.infoIcone} />
            <span>Último sobrevivente = Campeão</span>
          </div>
          <div className={styles.infoItem}>
            <Skull size={20} className={styles.infoIconeAlerta} />
            <span>Perdeu? Está eliminado!</span>
          </div>
          <div className={styles.infoItem}>
            <Users size={20} className={styles.infoIcone} />
            <span>{totalJogadores} jogador(es) na fila agora</span>
          </div>
        </div>

        <button
          className={styles.botaoPrimario}
          onClick={entrarNaFila}
          disabled={carregando}
        >
          <Swords size={18} />
          {carregando ? 'Entrando...' : 'Entrar na Fila'}
        </button>
      </div>
    </div>
  )
}
