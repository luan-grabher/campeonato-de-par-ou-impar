'use client'

import styles from './SeletorDeParidade.module.css'

type Paridade = 'par' | 'impar'

interface SeletorDeParidadeProps {
  valorSelecionado?: Paridade | null
  onChange?: (paridade: Paridade) => void
  desabilitado?: boolean
  oculto?: boolean
  className?: string
}

export default function SeletorDeParidade({
  valorSelecionado,
  onChange,
  desabilitado = false,
  oculto = false,
  className = '',
}: SeletorDeParidadeProps) {
  if (oculto) return null

  function handleClick(paridade: Paridade) {
    if (desabilitado) return
    onChange?.(paridade)
  }

  const opcoes: { valor: Paridade; label: string }[] = [
    { valor: 'par', label: 'Par' },
    { valor: 'impar', label: 'Ímpar' },
  ]

  return (
    <div className={`${styles.container} ${className}`} role="radiogroup" aria-label="Paridade">
      {opcoes.map(({ valor, label }) => {
        const selecionado = valorSelecionado === valor
        const classes = [
          styles.botao,
          selecionado && valor === 'par' ? styles.selecionadoPar : '',
          selecionado && valor === 'impar' ? styles.selecionadoImpar : '',
          desabilitado ? styles.desabilitado : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={valor}
            className={classes}
            onClick={() => handleClick(valor)}
            disabled={desabilitado}
            role="radio"
            aria-checked={selecionado}
            aria-label={label}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
