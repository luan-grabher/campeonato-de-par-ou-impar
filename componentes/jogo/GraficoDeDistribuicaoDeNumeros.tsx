'use client'

import styles from './GraficoDeDistribuicaoDeNumeros.module.css'

interface GraficoDeDistribuicaoDeNumerosProps {
  frequenciaDosNumeros: Record<number, number>
}

export default function GraficoDeDistribuicaoDeNumeros({
  frequenciaDosNumeros,
}: GraficoDeDistribuicaoDeNumerosProps) {
  const numeros = Array.from({ length: 11 }, (_, i) => i)

  const maxFrequencia = Math.max(
    ...numeros.map((n) => frequenciaDosNumeros[n] ?? 0),
    1
  )

  return (
    <div className={styles.container}>
      <h3 className={styles.titulo}>Distribuição dos Números</h3>
      <div className={styles.grafico}>
        {numeros.map((numero) => {
          const frequencia = frequenciaDosNumeros[numero] ?? 0
          const altura = (frequencia / maxFrequencia) * 100
          const temDados = frequencia > 0

          return (
            <div key={numero} className={styles.coluna}>
              <div className={styles.barraWrapper}>
                {temDados && (
                  <span className={styles.rotuloFrequencia}>{frequencia}</span>
                )}
                <div
                  className={styles.barra}
                  style={{ height: `${Math.max(altura, temDados ? 4 : 0)}%` }}
                  role="img"
                  aria-label={`Número ${numero}: ${frequencia} vez(es)`}
                />
              </div>
              <span className={styles.rotuloNumero}>{numero}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
