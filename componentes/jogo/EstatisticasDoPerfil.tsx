import styles from './EstatisticasDoPerfil.module.css'
import type { PerfilDoJogador, EstatisticasDoJogador } from '@/core/tipos/jogador'

interface EstatisticasDoPerfilProps {
  perfil: PerfilDoJogador
  estatisticas: EstatisticasDoJogador
  campeonatosVencidos: number
  numeroFavorito: number | null
  numeroMenosUsado: number | null
}

export default function EstatisticasDoPerfil({
  perfil,
  estatisticas,
  campeonatosVencidos,
  numeroFavorito,
  numeroMenosUsado,
}: EstatisticasDoPerfilProps) {
  const taxaVitoriaPercentual = (estatisticas.taxaDeVitoria * 100).toFixed(1)
  const tempoMedioFormatado = formatarTempo(estatisticas.tempoMedioPorJogada)

  return (
    <div className={styles.grid}>
      {/* Vitórias / Derrotas / Taxa */}
      <div className={styles.card}>
        <span className={styles.cardValor} style={{ color: 'var(--corVitoria)' }}>
          {perfil.totalDeVitorias}
        </span>
        <span className={styles.cardRotulo}>Vitórias</span>
      </div>

      <div className={styles.card}>
        <span className={styles.cardValor} style={{ color: 'var(--corDerrota)' }}>
          {perfil.totalDeDerrotas}
        </span>
        <span className={styles.cardRotulo}>Derrotas</span>
      </div>

      <div className={styles.card}>
        <span className={styles.cardValor}>{taxaVitoriaPercentual}%</span>
        <span className={styles.cardRotulo}>Taxa de Vitória</span>
      </div>

      {/* Total de partidas */}
      <div className={styles.card}>
        <span className={styles.cardValor}>{perfil.totalDePartidas}</span>
        <span className={styles.cardRotulo}>Total de Partidas</span>
      </div>

      {/* Sequência atual / maior sequência */}
      <div className={styles.card}>
        <span
          className={styles.cardValor}
          style={{
            color:
              perfil.sequenciaAtual >= 5
                ? 'var(--corEmpate)'
                : perfil.sequenciaAtual >= 3
                  ? 'var(--corDestaqueSecundario)'
                  : undefined,
          }}
        >
          {perfil.sequenciaAtual}
        </span>
        <span className={styles.cardRotulo}>Sequência Atual</span>
      </div>

      <div className={styles.card}>
        <span className={styles.cardValor}>{perfil.maiorSequencia}</span>
        <span className={styles.cardRotulo}>Maior Sequência</span>
      </div>

      {/* Números */}
      <div className={styles.card}>
        <span className={styles.cardValor}>
          {numeroFavorito ?? '—'}
        </span>
        <span className={styles.cardRotulo}>Nº Favorito</span>
      </div>

      <div className={styles.card}>
        <span className={styles.cardValor}>
          {numeroMenosUsado ?? '—'}
        </span>
        <span className={styles.cardRotulo}>Nº Menos Usado</span>
      </div>

      {/* Tempo médio */}
      <div className={styles.card}>
        <span className={styles.cardValor}>{tempoMedioFormatado}</span>
        <span className={styles.cardRotulo}>Tempo Médio/Jogada</span>
      </div>

      {/* Campeonatos vencidos */}
      <div className={styles.card}>
        <span className={styles.cardValor}>{campeonatosVencidos}</span>
        <span className={styles.cardRotulo}>Campeonatos</span>
      </div>

      {/* Percentual Par / Ímpar */}
      <div className={styles.cardLargo}>
        <span className={styles.cardRotulo}>Par / Ímpar</span>
        <div className={styles.barraParidade}>
          {estatisticas.frequenciaDePares > 0 || estatisticas.frequenciaDeImpares > 0 ? (
            <>
              <div className={styles.barraParidadeLinha}>
                <div
                  className={styles.barraParValor}
                  style={{ width: `${(estatisticas.frequenciaDePares * 100).toFixed(0)}%` }}
                >
                  <span>Par {(estatisticas.frequenciaDePares * 100).toFixed(0)}%</span>
                </div>
                <div
                  className={styles.barraImparValor}
                  style={{ width: `${(estatisticas.frequenciaDeImpares * 100).toFixed(0)}%` }}
                >
                  <span>Ímpar {(estatisticas.frequenciaDeImpares * 100).toFixed(0)}%</span>
                </div>
              </div>
            </>
          ) : (
            <span className={styles.semDados}>Sem dados</span>
          )}
        </div>
      </div>
    </div>
  )
}

function formatarTempo(segundos: number): string {
  if (segundos <= 0) return '—'
  if (segundos < 60) return `${segundos.toFixed(0)}s`
  const min = Math.floor(segundos / 60)
  const seg = Math.round(segundos % 60)
  return `${min}m ${seg}s`
}
