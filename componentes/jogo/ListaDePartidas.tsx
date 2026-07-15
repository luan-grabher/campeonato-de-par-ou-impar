'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Swords, Users, Award, List } from 'lucide-react'
import type { PartidaNoHistorico, FiltroTipo } from '@/servidor/acoes/buscarHistoricoDePartidas'
import ItemDoHistorico from './ItemDoHistorico'
import styles from './ListaDePartidas.module.css'

interface ListaDePartidasProps {
  partidas: PartidaNoHistorico[]
  total: number
  pagina: number
  totalDePaginas: number
  filtroAtivo: FiltroTipo
}

interface OpcaoDeFiltro {
  valor: FiltroTipo
  rotulo: string
  icone: typeof List
}

const opcoesDeFiltro: OpcaoDeFiltro[] = [
  { valor: 'todas', rotulo: 'Todas', icone: List },
  { valor: 'partida_rapida', rotulo: 'Partida Rápida', icone: Swords },
  { valor: 'sala_privada', rotulo: 'Sala Privada', icone: Users },
  { valor: 'campeonato', rotulo: 'Campeonato', icone: Award },
]

export default function ListaDePartidas({
  partidas,
  total,
  pagina,
  totalDePaginas,
  filtroAtivo,
}: ListaDePartidasProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function montarUrl(parametros: Record<string, string | undefined>): string {
    const params = new URLSearchParams(searchParams.toString())

    for (const [chave, valor] of Object.entries(parametros)) {
      if (valor === undefined || valor === '' || valor === 'todas') {
        params.delete(chave)
      } else {
        params.set(chave, valor)
      }
    }

    const queryString = params.toString()
    return `/partidas${queryString ? `?${queryString}` : ''}`
  }

  function handleFiltro(valor: FiltroTipo) {
    const url = montarUrl({ tipo: valor === 'todas' ? undefined : valor, pagina: undefined })
    router.push(url)
  }

  function handlePagina(novaPagina: number) {
    const url = montarUrl({ pagina: novaPagina > 1 ? String(novaPagina) : undefined })
    router.push(url)
  }

  return (
    <div className={styles.lista}>
      {/* Filtros */}
      <div className={styles.filtros} role="tablist" aria-label="Filtrar por tipo de partida">
        {opcoesDeFiltro.map((opcao) => {
          const ativo = filtroAtivo === opcao.valor
          const Icone = opcao.icone

          return (
            <button
              key={opcao.valor}
              type="button"
              role="tab"
              aria-selected={ativo}
              className={`${styles.botaoFiltro} ${ativo ? styles.filtroAtivo : ''}`}
              onClick={() => handleFiltro(opcao.valor)}
            >
              <Icone size={16} />
              {opcao.rotulo}
            </button>
          )
        })}
      </div>

      {/* Total */}
      <p className={styles.totalInfo}>
        {total} partida{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
      </p>

      {/* Lista */}
      {partidas.length === 0 ? (
        <div className={styles.vazio}>
          <List size={48} className={styles.iconeVazio} />
          <p className={styles.vazioTexto}>Nenhuma partida encontrada.</p>
          <p className={styles.vazioSubtitulo}>
            Jogue algumas partidas para ver seu histórico aqui.
          </p>
        </div>
      ) : (
        <div className={styles.listaDeItens}>
          {partidas.map((partida, index) => (
            <div
              key={partida.id}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <ItemDoHistorico partida={partida} />
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalDePaginas > 1 && (
        <nav className={styles.paginacao} aria-label="Paginação do histórico">
          <button
            type="button"
            className={`${styles.botaoPagina} ${pagina <= 1 ? styles.botaoPaginaDesabilitado : ''}`}
            onClick={() => handlePagina(pagina - 1)}
            disabled={pagina <= 1}
          >
            &laquo; Anterior
          </button>

          <div className={styles.paginaInfo}>
            <span className={styles.paginaAtiva}>{pagina}</span>
            <span className={styles.paginaSeparador}>de</span>
            <span>{totalDePaginas}</span>
          </div>

          <button
            type="button"
            className={`${styles.botaoPagina} ${pagina >= totalDePaginas ? styles.botaoPaginaDesabilitado : ''}`}
            onClick={() => handlePagina(pagina + 1)}
            disabled={pagina >= totalDePaginas}
          >
            Próximo &raquo;
          </button>
        </nav>
      )}
    </div>
  )
}
