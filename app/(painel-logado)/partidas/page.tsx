import { buscarHistoricoDePartidas } from '@/servidor/acoes/buscarHistoricoDePartidas'
import type { FiltroTipo } from '@/servidor/acoes/buscarHistoricoDePartidas'
import ListaDePartidas from '@/componentes/jogo/ListaDePartidas'
import styles from './page.module.css'

interface PaginaPartidasProps {
  searchParams: Promise<{ tipo?: string; pagina?: string }>
}

const filtrosValidos: Set<string> = new Set([
  'todas',
  'partida_rapida',
  'sala_privada',
  'campeonato',
])

export default async function PaginaPartidas({
  searchParams,
}: PaginaPartidasProps) {
  const params = await searchParams
  const filtroTipo: FiltroTipo = filtrosValidos.has(params.tipo ?? '')
    ? (params.tipo as FiltroTipo)
    : 'todas'
  const paginaAtual = Number(params.pagina) || 1

  const resultado = await buscarHistoricoDePartidas(filtroTipo, paginaAtual)

  if ('erro' in resultado) {
    return (
      <div className={styles.pagina}>
        <div className={styles.container}>
          <h1 className={styles.titulo}>📋 Histórico de Partidas</h1>
          <div className={styles.erro}>
            <p>{resultado.erro}</p>
          </div>
        </div>
      </div>
    )
  }

  const { partidas, total, pagina, totalDePaginas } = resultado

  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <h1 className={styles.titulo}>📋 Histórico de Partidas</h1>

        <ListaDePartidas
          partidas={partidas}
          total={total}
          pagina={pagina}
          totalDePaginas={totalDePaginas}
          filtroAtivo={filtroTipo}
        />
      </div>
    </div>
  )
}
