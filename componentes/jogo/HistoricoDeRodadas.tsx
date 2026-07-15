'use client'

import styles from './HistoricoDeRodadas.module.css'

interface RodadaHistorico {
  numeroDaRodada: number
  numeroDoJogador: number
  paridadeDoJogador: 'par' | 'impar'
  numeroDaIa: number
  paridadeDaIa: 'par' | 'impar'
  jogadorVenceu: boolean
}

interface HistoricoDeRodadasProps {
  rodadas: RodadaHistorico[]
  className?: string
}

export default function HistoricoDeRodadas({
  rodadas,
  className = '',
}: HistoricoDeRodadasProps) {
  if (rodadas.length === 0) return null

  return (
    <div className={`${styles.container} ${className}`}>
      <h3 className={styles.titulo}>Histórico de Rodadas</h3>

      <div className={styles.lista}>
        {rodadas.map((rodada) => (
          <div
            key={rodada.numeroDaRodada}
            className={`${styles.item} ${
              rodada.jogadorVenceu ? styles.itemVitoria : styles.itemDerrota
            }`}
          >
            <span className={styles.rotuloRodada}>
              Rodada {rodada.numeroDaRodada}
            </span>

            <div className={styles.jogadas}>
              <span className={styles.jogada}>
                Você: <strong>{rodada.numeroDoJogador}</strong>{' '}
                <span
                  className={
                    rodada.paridadeDoJogador === 'par'
                      ? styles.par
                      : styles.impar
                  }
                >
                  ({rodada.paridadeDoJogador === 'par' ? 'PAR' : 'ÍMPAR'})
                </span>
              </span>

              <span className={styles.vs}>vs</span>

              <span className={styles.jogada}>
                IA: <strong>{rodada.numeroDaIa}</strong>{' '}
                <span
                  className={
                    rodada.paridadeDaIa === 'par' ? styles.par : styles.impar
                  }
                >
                  ({rodada.paridadeDaIa === 'par' ? 'PAR' : 'ÍMPAR'})
                </span>
              </span>
            </div>

            <span
              className={`${styles.resultado} ${
                rodada.jogadorVenceu
                  ? styles.resultadoVitoria
                  : styles.resultadoDerrota
              }`}
            >
              {rodada.jogadorVenceu ? '✅ Venceu' : '❌ Perdeu'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
