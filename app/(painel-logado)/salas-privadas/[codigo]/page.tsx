'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TelaDeSalaPrivada from '@/componentes/jogo/TelaDeSalaPrivada'
import TelaDeEspera from '@/componentes/jogo/TelaDeEspera'
import { buscarSalaPorCodigo } from '@/servidor/acoes/buscarSalaPorCodigo'
import { entrarEmSalaPrivada } from '@/servidor/acoes/entrarEmSalaPrivada'
import { usarJogadorAutenticado } from '@/hooks/usarJogadorAutenticado'
import type { ModoDeJogo } from '@/core/tipos/partida'
import styles from './page.module.css'

interface DadosDaSala {
  id: string
  codigo: string
  titulo: string
  idDoAnfitriao: string
  totalDeRodadas: 3 | 5 | 7
  modoDeJogo: ModoDeJogo
  status: 'aguardando_oponente' | 'em_andamento' | 'finalizada' | 'cancelada'
}

type EstadoPagina =
  | { status: 'carregando' }
  | { status: 'sala_carregada'; sala: DadosDaSala }
  | { status: 'erro'; mensagem: string }

export default function PaginaDaSala() {
  const params = useParams()
  const router = useRouter()
  const codigo = params?.codigo as string
  const { jogador, carregando: jogadorCarregando } = usarJogadorAutenticado()
  const [estado, setEstado] = useState<EstadoPagina>({ status: 'carregando' })
  const [carregandoAcao, setCarregandoAcao] = useState(false)
  const [erroAcao, setErroAcao] = useState<string | null>(null)

  // Carregar sala
  useEffect(() => {
    if (!codigo) return

    async function carregarSala() {
      const resultado = await buscarSalaPorCodigo(codigo)

      if (resultado.status === 'erro') {
        setEstado({ status: 'erro', mensagem: resultado.mensagem })
        return
      }

      setEstado({
        status: 'sala_carregada',
        sala: resultado.sala,
      })
    }

    carregarSala()
  }, [codigo])

  const lidarIniciarOuEntrar = useCallback(async () => {
    if (estado.status !== 'sala_carregada') return
    if (!jogador) return

    setCarregandoAcao(true)
    setErroAcao(null)

    const sala = estado.sala
    const ehAnfitriao = jogador.id === sala.idDoAnfitriao

    if (ehAnfitriao) {
      // Anfitrião: se já há partida vinculada, redirecionar
      // Se não, verificar se já tem oponente
      if (sala.status === 'em_andamento') {
        // Buscar partida vinculada
        try {
          const supabase = (await import('@/servidor/integracoes/supabase/criarClienteNavegador')).criarClienteNavegador()
          const { data: partida } = await supabase
            .from('partidas')
            .select('id')
            .eq('id_da_sala', sala.id)
            .single()

          if (partida) {
            router.push(`/partida-rapida/jogo/${partida.id}`)
            return
          }
        } catch {
          // Erro ao buscar partida
        }
      }

      // Se está aguardando mas a página foi recarregada, pode estar esperando
      if (sala.status === 'aguardando_oponente') {
        setErroAcao('Aguardando um oponente entrar na sala.')
        setCarregandoAcao(false)
        return
      }

      setErroAcao('Não foi possível iniciar a partida.')
      setCarregandoAcao(false)
      return
    }

    // Não é anfitrião — entrar na sala
    const resultado = await entrarEmSalaPrivada(codigo)

    if (resultado.status === 'erro') {
      setErroAcao(resultado.mensagem)
      setCarregandoAcao(false)
      return
    }

    router.push(`/partida-rapida/jogo/${resultado.idDaPartida}`)
  }, [estado, jogador, codigo, router])

  if (jogadorCarregando || estado.status === 'carregando') {
    return (
      <div className={styles.pagina}>
        <TelaDeEspera onCancelar={() => router.push('/salas-privadas')} mensagem="Carregando sala..." />
      </div>
    )
  }

  if (estado.status === 'erro') {
    return (
      <div className={styles.pagina}>
        <div className={styles.erroContainer}>
          <h2 className={styles.erroTitulo}>Sala não encontrada</h2>
          <p className={styles.erroDescricao}>{estado.mensagem}</p>
          <button
            className={styles.botaoVoltar}
            onClick={() => router.push('/salas-privadas')}
          >
            Voltar para Salas
          </button>
        </div>
      </div>
    )
  }

  if (!jogador) {
    return (
      <div className={styles.pagina}>
        <div className={styles.erroContainer}>
          <h2 className={styles.erroTitulo}>Não autenticado</h2>
          <p className={styles.erroDescricao}>Faça login para acessar esta sala.</p>
          <button
            className={styles.botaoVoltar}
            onClick={() => router.push('/login')}
          >
            Fazer Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pagina}>
      {erroAcao && (
        <div className={styles.erroAcao}>
          {erroAcao}
        </div>
      )}

      <TelaDeSalaPrivada
        sala={estado.sala}
        onIniciarPartida={lidarIniciarOuEntrar}
        carregando={carregandoAcao}
      />
    </div>
  )
}
