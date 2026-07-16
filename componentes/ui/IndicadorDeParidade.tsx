'use client'

import styles from './IndicadorDeParidade.module.css'

type Paridade = 'par' | 'impar'
type TamanhoDoIndicador = 'pequeno' | 'medio' | 'grande'

interface IndicadorDeParidadeProps {
  paridade: Paridade
  tamanho?: TamanhoDoIndicador
}

const MAPA_DE_ICONE: Record<Paridade, string> = {
  par: '🟦',
  impar: '🟩',
}

const MAPA_DE_TEXTO: Record<Paridade, string> = {
  par: 'PAR',
  impar: 'ÍMPAR',
}

const MAPA_DE_ARIA_LABEL: Record<Paridade, string> = {
  par: 'Paridade atual: Par',
  impar: 'Paridade atual: Ímpar',
}

export default function IndicadorDeParidade({
  paridade,
  tamanho = 'medio',
}: IndicadorDeParidadeProps) {
  const classes = [
    styles.indicador,
    styles[tamanho],
    styles[paridade],
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      role="status"
      aria-label={MAPA_DE_ARIA_LABEL[paridade]}
    >
      <span className={styles.icone} aria-hidden="true">
        {MAPA_DE_ICONE[paridade]}
      </span>
      <span className={styles.texto}>
        {MAPA_DE_TEXTO[paridade]}
      </span>
    </div>
  )
}
