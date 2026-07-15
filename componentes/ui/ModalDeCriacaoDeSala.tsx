'use client'

import { useState, useEffect } from 'react'
import Botao from './Botao'
import InputTexto from './InputTexto'
import styles from './ModalDeCriacaoDeSala.module.css'

const MODOS_DE_JOGO = [
  { valor: 'classico', nome: 'Clássico', descricao: '1 ou 2, par ou ímpar' },
  { valor: 'dificil', nome: 'Difícil', descricao: '0 a 10, mais estratégia' },
  { valor: 'relampago', nome: 'Relâmpago', descricao: '5 segundos por rodada' },
  { valor: 'invisivel', nome: 'Invisível', descricao: 'Paridade só no fim' },
  { valor: 'caos', nome: 'Caos', descricao: 'Intervalo aleatório' },
  { valor: 'sobrevivencia', nome: 'Sobrevivência', descricao: 'Jogue até errar' },
] as const

interface ModalDeCriacaoDeSalaProps {
  aberto: boolean
  carregando?: boolean
  onFechar: () => void
  onCriar: (dados: {
    titulo: string
    totalDeRodadas: 3 | 5 | 7
    modoDeJogo: string
  }) => void
}

export default function ModalDeCriacaoDeSala({
  aberto,
  carregando = false,
  onFechar,
  onCriar,
}: ModalDeCriacaoDeSalaProps) {
  const [titulo, setTitulo] = useState('')
  const [totalDeRodadas, setTotalDeRodadas] = useState<3 | 5 | 7>(5)
  const [modoDeJogo, setModoDeJogo] = useState('classico')
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    if (!aberto) {
      setSaindo(false)
      setTitulo('')
      setTotalDeRodadas(5)
      setModoDeJogo('classico')
    }
  }, [aberto])

  useEffect(() => {
    if (!aberto) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        lidarFechar()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [aberto])

  function lidarFechar() {
    if (carregando) return
    setSaindo(true)
    setTimeout(() => {
      setSaindo(false)
      onFechar()
    }, 200)
  }

  function lidarSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim() || carregando) return
    onCriar({ titulo: titulo.trim(), totalDeRodadas, modoDeJogo })
  }

  if (!aberto && !saindo) return null

  const overlayClasses = `${styles.overlay} ${saindo ? styles.saindo : ''}`
  const cardClasses = `${styles.card} ${saindo ? styles.saindo : ''}`

  return (
    <div
      className={overlayClasses}
      onClick={lidarFechar}
      role="dialog"
      aria-modal="true"
      aria-label="Criar Sala Privada"
    >
      <div className={cardClasses} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.titulo}>Criar Sala Privada</h2>
        <p className={styles.descricao}>
          Crie uma sala com código único para jogar com um amigo.
        </p>

        <form onSubmit={lidarSubmit} className={styles.formulario}>
          <InputTexto
            label="Título da Sala"
            placeholder="Ex: Desafio de sexta"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={50}
            required
          />

          <div className={styles.grupo}>
            <label className={styles.label}>Total de Rodadas</label>
            <div className={styles.opcoesLinha}>
              {([3, 5, 7] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`${styles.opcao} ${totalDeRodadas === n ? styles.opcaoAtiva : ''}`}
                  onClick={() => setTotalDeRodadas(n)}
                  disabled={carregando}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.grupo}>
            <label className={styles.label}>Modo de Jogo</label>
            <div className={styles.modos}>
              {MODOS_DE_JOGO.map((modo) => (
                <button
                  key={modo.valor}
                  type="button"
                  className={`${styles.modoOpcao} ${modoDeJogo === modo.valor ? styles.modoAtivo : ''}`}
                  onClick={() => setModoDeJogo(modo.valor)}
                  disabled={carregando}
                >
                  <span className={styles.modoNome}>{modo.nome}</span>
                  <span className={styles.modoDescricao}>{modo.descricao}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.acoes}>
            <Botao
              type="button"
              variante="ghost"
              onClick={lidarFechar}
              disabled={carregando}
            >
              Cancelar
            </Botao>
            <Botao
              type="submit"
              variante="primario"
              carregando={carregando}
              disabled={!titulo.trim()}
            >
              Criar Sala
            </Botao>
          </div>
        </form>
      </div>
    </div>
  )
}
