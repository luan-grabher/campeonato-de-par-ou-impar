import { buscarRanking } from '@/servidor/acoes/buscarRanking'
import { determinarFaixaDoElo } from '@/core/constantes/faixasDeElo'
import BadgeDeElo from '@/componentes/ui/BadgeDeElo'
import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import Link from 'next/link'
import styles from './page.module.css'

function badgeKeyFromNome(faixaNome: string): string {
  const mapa: Record<string, string> = {
    Bronze: 'bronze',
    Prata: 'prata',
    Ouro: 'ouro',
    Platina: 'platina',
    Diamante: 'diamante',
    Mestre: 'mestre',
    'Lendário': 'lendario',
  }
  return mapa[faixaNome] ?? 'ferro'
}

export default async function PaginaRanking({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>
}) {
  const params = await searchParams
  const paginaAtual = Number(params.pagina) || 1

  const [resultado, dadosAuth] = await Promise.all([
    buscarRanking(paginaAtual),
    criarClienteServidor().then((supabase) => supabase.auth.getUser()),
  ])

  const idDoUsuarioLogado = dadosAuth.data?.user?.id ?? null
  const { jogadores, total, pagina, totalDePaginas } = resultado
  const top3 = jogadores.slice(0, 3)

  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <h1 className={styles.titulo}>🏆 Ranking</h1>
        <p className={styles.subtitulo}>
          Os melhores jogadores do Campeonato de Par ou Ímpar
          {total > 0 && (
            <span className={styles.totalJogadores}>
              {' '}— {total} jogador{total !== 1 ? 'es' : ''}
            </span>
          )}
        </p>

        {/* Top 3 destacado */}
        {top3.length > 0 && (
          <div className={styles.top3}>
            {top3.map((jogador, index) => {
              const faixa = determinarFaixaDoElo(jogador.elo)
              return (
                <div
                  key={jogador.id}
                  className={`${styles.topCard} ${
                    index === 0
                      ? styles.topPrimeiro
                      : index === 1
                        ? styles.topSegundo
                        : styles.topTerceiro
                  }`}
                >
                  <span className={styles.topMedalha}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <span className={styles.topNome}>{jogador.nome}</span>
                  <span className={styles.topElo}>{jogador.elo} Elo</span>
                  <BadgeDeElo faixa={badgeKeyFromNome(faixa.nome)} />
                </div>
              )
            })}
          </div>
        )}

        {/* Tabela completa */}
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th className={styles.colPosicao}>#</th>
                <th className={styles.colJogador}>Jogador</th>
                <th className={styles.colElo}>Elo</th>
                <th className={styles.colFaixa}>Faixa</th>
                <th className={styles.colNumerica}>Partidas</th>
                <th className={styles.colNumerica}>Vitórias</th>
              </tr>
            </thead>
            <tbody>
              {jogadores.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.semDados}>
                    Nenhum jogador encontrado ainda.
                  </td>
                </tr>
              ) : (
                jogadores.map((jogador) => {
                  const faixa = determinarFaixaDoElo(jogador.elo)
                  const ehUsuarioLogado = jogador.id === idDoUsuarioLogado
                  return (
                    <tr
                      key={jogador.id}
                      className={`${styles.linha} ${
                        ehUsuarioLogado ? styles.linhaDestaque : ''
                      }`}
                    >
                      <td className={styles.colPosicao}>
                        <span
                          className={`${styles.posicaoNumero} ${
                            jogador.posicao <= 3 ? styles.posicaoDestaque : ''
                          }`}
                        >
                          {jogador.posicao}
                        </span>
                      </td>
                      <td className={styles.colJogador}>
                        <span className={styles.nomeJogador}>
                          {jogador.nome}
                          {ehUsuarioLogado && (
                            <span className={styles.voce}>você</span>
                          )}
                        </span>
                      </td>
                      <td className={styles.colElo}>{jogador.elo}</td>
                      <td className={styles.colFaixa}>
                        <BadgeDeElo faixa={badgeKeyFromNome(faixa.nome)} />
                      </td>
                      <td className={styles.colNumerica}>
                        {jogador.totalDePartidas}
                      </td>
                      <td className={styles.colNumerica}>
                        {jogador.totalDeVitorias}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalDePaginas > 1 && (
          <nav className={styles.paginacao} aria-label="Paginação do ranking">
            <Link
              href={pagina > 1 ? `/ranking?pagina=${pagina - 1}` : '#'}
              className={`${styles.botaoPagina} ${
                pagina <= 1 ? styles.botaoPaginaDesabilitado : ''
              }`}
              aria-disabled={pagina <= 1}
              tabIndex={pagina <= 1 ? -1 : undefined}
            >
              &laquo; Anterior
            </Link>

            <div className={styles.paginaInfo}>
              <span className={styles.paginaAtiva}>{pagina}</span>
              <span className={styles.paginaSeparador}>de</span>
              <span>{totalDePaginas}</span>
            </div>

            <Link
              href={
                pagina < totalDePaginas
                  ? `/ranking?pagina=${pagina + 1}`
                  : '#'
              }
              className={`${styles.botaoPagina} ${
                pagina >= totalDePaginas
                  ? styles.botaoPaginaDesabilitado
                  : ''
              }`}
              aria-disabled={pagina >= totalDePaginas}
              tabIndex={pagina >= totalDePaginas ? -1 : undefined}
            >
              Próximo &raquo;
            </Link>
          </nav>
        )}
      </div>
    </div>
  )
}
