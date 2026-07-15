'use client'

import { type InputHTMLAttributes, forwardRef } from 'react'
import styles from './InputTexto.module.css'

interface InputTextoProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  erro?: string
}

const InputTexto = forwardRef<HTMLInputElement, InputTextoProps>(
  function InputTexto({ label, erro, className = '', id, ...props }, ref) {
    const idGerado = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`

    return (
      <div className={`${styles.grupo} ${className}`}>
        {label && (
          <label htmlFor={idGerado} className={styles.label}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={idGerado}
          className={styles.input}
          aria-invalid={!!erro}
          aria-describedby={erro ? `${idGerado}-erro` : undefined}
          {...props}
        />
        {erro && (
          <span id={`${idGerado}-erro`} className={styles.erro} role="alert">
            {erro}
          </span>
        )}
      </div>
    )
  }
)

export default InputTexto
