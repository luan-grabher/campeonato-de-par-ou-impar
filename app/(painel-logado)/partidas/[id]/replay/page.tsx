import { Suspense } from 'react'
import { buscarReplayDaPartida } from '@/servidor/acoes/buscarReplayDaPartida'
import VisualizadorDeReplay from '@/componentes/jogo/VisualizadorDeReplay'
import Botao from '@/componentes/ui/Botao'
import Link from 'next/link'
import styles from './page.module.css'

interface PaginaReplayProps {
  params: Promise<{ id: string }>
}

async function ConteudoDaPagina({ idDaPartida }: { idDaPartida: string }) {
  const resultado = await buscarReplayDaPartida(idDaPartida)

  if (!resultado.sucesso) {
    return (
      <div className={styles.container}>
        <div className={styles.cardErro}>
          <h1 className={styles.tituloErro}>🎬 Replay não encontrado</h1>
          <p className={styles.textoErro}>
            {resultado.naoEncontrado
              ? 'Esta partida não possui replay disponível.'
              : resultado.erro}
          </p>
          <div className={styles.acoes}>
            <Link href="/partidas">
              <Botao variante="primario" tamanho="medio">
                Voltar para Histórico
              </Botao>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <VisualizadorDeReplay
      dados={resultado.replay}
      onVoltar={() => {
        if (typeof window !== 'undefined') {
          window.history.back()
        }
      }}
    />
  )
}

export default async function PaginaReplay({
  params,
}: PaginaReplayProps) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.carregando}>
            <div className={styles.spinner} aria-hidden="true" />
            <p>Carregando replay...</p>
          </div>
        </div>
      }
    >
      <ConteudoDaPagina idDaPartida={id} />
    </Suspense>
  )
}
