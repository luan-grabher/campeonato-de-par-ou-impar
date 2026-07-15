'use client'

import styles from './PlacarDaPartida.module.css'

interface PlacarDaPartidaProps {
  jogadorA: string
  pontuacaoA: number
  jogadorB: string
  pontuacaoB: number
  rodadaAtual: number
  totalRodadas: number
  jogadorAtivo?: 'A' | 'B'
  className?: string
}

export default function PlacarDaPartida({
  jogadorA,
  pontuacaoA,
  jogadorB,
  pontuacaoB,
  rodadaAtual,
  totalRodadas,
  jogadorAtivo,
  className = '',
}: PlacarDaPartidaProps) {
  return (
    <div className={`${styles.placar} ${className}`}>
      <div className={styles.jogador}>
        <span
          className={`${styles.nomeJogador} ${jogadorAtivo === 'A' ? styles.nomeJogadorAtivo : ''}`}
        >
          {jogadorA}
        </span>
        <div className={styles.pontuacao}>{pontuacaoA}</div>
      </div>

      <div className={styles.meio}>
        <span className={styles.vs}>VS</span>
        <span className={styles.rodada}>
          Rodada {rodadaAtual}/{totalRodadas}
        </span>
      </div>

      <div className={styles.jogador}>
        <span
          className={`${styles.nomeJogador} ${jogadorAtivo === 'B' ? styles.nomeJogadorAtivo : ''}`}
        >
          {jogadorB}
        </span>
        <div className={styles.pontuacao}>{pontuacaoB}</div>
      </div>
    </div>
  )
}
