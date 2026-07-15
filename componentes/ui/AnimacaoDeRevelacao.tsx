'use client'

import styles from './AnimacaoDeRevelacao.module.css'

interface AnimacaoDeRevelacaoProps {
  numero: number
  paridade: 'par' | 'impar'
  venceu: boolean
  ativo: boolean
  className?: string
}

export default function AnimacaoDeRevelacao({
  numero,
  paridade,
  venceu,
  ativo,
  className = '',
}: AnimacaoDeRevelacaoProps) {
  if (!ativo) return null

  const frenteClasses = [
    styles.face,
    styles.frente,
    venceu ? styles.frenteVitoria : styles.frenteDerrota,
  ].join(' ')

  return (
    <div className={`${styles.container} ${className}`} aria-live="polite">
      <div className={styles.carta}>
        {/* Verso (aparece primeiro, depois vira) */}
        <div className={`${styles.face} ${styles.verso}`}>
          <span className={styles.versoIcone}>?</span>
        </div>

        {/* Frente (revelada após rotação) */}
        <div className={frenteClasses}>
          <span className={styles.numeroRevelado}>{numero}</span>
          <span className={styles.paridadeRevelada}>
            {paridade === 'par' ? 'PAR' : 'ÍMPAR'}
          </span>
          <span
            className={`${styles.resultado} ${venceu ? styles.resultadoVitoria : styles.resultadoDerrota}`}
          >
            {venceu ? 'Venceu' : 'Perdeu'}
          </span>
        </div>
      </div>
    </div>
  )
}
