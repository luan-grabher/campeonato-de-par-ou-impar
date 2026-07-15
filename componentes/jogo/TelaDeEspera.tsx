'use client'

import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import styles from './TelaDeEspera.module.css'

interface TelaDeEsperaProps {
  onCancelar: () => void
  mensagem?: string
}

export default function TelaDeEspera({
  onCancelar,
  mensagem = 'Procurando oponente...',
}: TelaDeEsperaProps) {
  const [cancelando, setCancelando] = useState(false)

  const lidarCancelar = useCallback(() => {
    setCancelando(true)
    onCancelar()
  }, [onCancelar])

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.animacao}>
          <Search size={48} className={styles.iconePulsante} />
        </div>

        <h2 className={styles.titulo}>{mensagem}</h2>

        <p className={styles.subtitulo}>
          Aguarde enquanto encontramos um oponente do seu nível.
        </p>

        <div className={styles.pontinhos}>
          <span className={styles.ponto} />
          <span className={styles.ponto} />
          <span className={styles.ponto} />
        </div>

        <button
          className={styles.botaoCancelar}
          onClick={lidarCancelar}
          disabled={cancelando}
        >
          <X size={18} />
          {cancelando ? 'Cancelando...' : 'Cancelar'}
        </button>
      </div>
    </div>
  )
}
