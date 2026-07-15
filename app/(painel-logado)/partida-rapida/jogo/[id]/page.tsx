'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { criarClienteNavegador } from '@/servidor/integracoes/supabase/criarClienteNavegador'
import { usarJogadorAutenticado } from '@/hooks/usarJogadorAutenticado'
import type { DadosDaPartida, ModoDeJogo } from '@/core/tipos/partida'
import type { PerfilDoJogador } from '@/core/tipos/jogador'
import TelaDePartida from '@/componentes/jogo/TelaDePartida'
import TelaDeEspera from '@/componentes/jogo/TelaDeEspera'
import styles from './page.module.css'

interface DadosDoOponente {
  id: string
  nome: string
  elo: number
  avatarUrl?: string | null
}

type EstadoCarregamento =
  | { status: 'carregando' }
  | { status: 'partida_carregada'; partida: DadosDaPartida; oponente: DadosDoOponente }
  | { status: 'erro'; mensagem: string }

export default function PaginaJogo() {
  const params = useParams()
  const idDaPartida = params?.id as string
  const { jogador, carregando: jogadorCarregando } = usarJogadorAutenticado()
  const [estado, setEstado] = useState<EstadoCarregamento>({ status: 'carregando' })

  useEffect(() => {
    if (jogadorCarregando || !jogador || !idDaPartida) return

    const jogadorAtual = jogador

    async function carregarPartida() {
      const supabase = criarClienteNavegador()

      const { data: partida, error } = await supabase
        .from('partidas')
        .select('*')
        .eq('id', idDaPartida)
        .single()

      if (error || !partida) {
        setEstado({ status: 'erro', mensagem: 'Partida não encontrada.' })
        return
      }

      const dadosPartida: DadosDaPartida = {
        id: partida.id as string,
        modo: partida.modo as ModoDeJogo,
        tipo: partida.tipo as DadosDaPartida['tipo'],
        idDoPrimeiroJogador: partida.id_do_primeiro_jogador as string | null,
        idDoSegundoJogador: partida.id_do_segundo_jogador as string | null,
        idDaSala: partida.id_da_sala as string | null,
        idDoCampeonato: partida.id_do_campeonato as string | null,
        status: partida.status as DadosDaPartida['status'],
        totalDeRodadasPrevisto: partida.total_de_rodadas_previsto as number,
        rodadaAtual: partida.rodada_atual as number,
        vencedorId: partida.vencedor_id as string | null,
      }

      const idDoOponente =
        partida.id_do_primeiro_jogador === jogadorAtual.id
          ? partida.id_do_segundo_jogador
          : partida.id_do_primeiro_jogador

      if (!idDoOponente) {
        setEstado({ status: 'erro', mensagem: 'Oponente não encontrado.' })
        return
      }

      const { data: perfilOponente } = await supabase
        .from('perfis')
        .select('*')
        .eq('id_usuario', idDoOponente)
        .single()

      if (!perfilOponente) {
        setEstado({ status: 'erro', mensagem: 'Oponente não encontrado.' })
        return
      }

      const oponente: DadosDoOponente = {
        id: perfilOponente.id_usuario as string,
        nome: perfilOponente.nome as string,
        elo: perfilOponente.elo as number,
        avatarUrl: perfilOponente.url_do_avatar as string | null,
      }

      setEstado({ status: 'partida_carregada', partida: dadosPartida, oponente })
    }

    carregarPartida()
  }, [idDaPartida, jogador, jogadorCarregando])

  if (jogadorCarregando || estado.status === 'carregando') {
    return (
      <div className={styles.pagina}>
        <TelaDeEspera onCancelar={() => {}} mensagem="Carregando partida..." />
      </div>
    )
  }

  if (estado.status === 'erro') {
    return (
      <div className={styles.pagina}>
        <div className={styles.erro}>
          <h2>Erro ao carregar partida</h2>
          <p>{estado.mensagem}</p>
        </div>
      </div>
    )
  }

  if (!jogador) {
    return (
      <div className={styles.pagina}>
        <div className={styles.erro}>
          <h2>Não autenticado</h2>
          <p>Faça login para jogar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pagina}>
      <TelaDePartida
        partida={estado.partida}
        jogador={jogador}
        oponente={estado.oponente}
        idDaPartida={idDaPartida}
      />
    </div>
  )
}
