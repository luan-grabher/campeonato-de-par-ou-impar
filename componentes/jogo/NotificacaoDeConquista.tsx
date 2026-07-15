'use client'

import { useEffect, useState } from 'react'
import {
  Trophy,
  Flame,
  Shield,
  Crown,
  Zap,
  Skull,
  Ghost,
  Heart,
  Clock,
  Users,
  Clover,
  type LucideIcon,
} from 'lucide-react'
import type { ConquistaNova } from '@/servidor/acoes/verificarConquistas'
import styles from './NotificacaoDeConquista.module.css'

const MAPA_DE_ICONES: Record<string, LucideIcon> = {
  trophy: Trophy,
  flame: Flame,
  shield: Shield,
  crown: Crown,
  lightning: Zap,
  skull: Skull,
  ghost: Ghost,
  heart: Heart,
  clock: Clock,
  users: Users,
  clover: Clover,
}

function obterIcone(nome: string): LucideIcon {
  return MAPA_DE_ICONES[nome] ?? Trophy
}

interface NotificacaoDeConquistaProps {
  conquistas: ConquistaNova[]
  aoFechar?: () => void
}

export default function NotificacaoDeConquista({
  conquistas,
  aoFechar,
}: NotificacaoDeConquistaProps) {
  const [visivel, setVisivel] = useState(false)
  const [indiceAtual, setIndiceAtual] = useState(0)

  useEffect(() => {
    if (conquistas.length > 0) {
      setVisivel(true)
      setIndiceAtual(0)
    }
  }, [conquistas])

  useEffect(() => {
    if (!visivel || conquistas.length === 0) return

    const tempoPorConquista = 4000

    const timer = setTimeout(() => {
      if (indiceAtual < conquistas.length - 1) {
        setIndiceAtual((prev) => prev + 1)
      } else {
        setVisivel(false)
        aoFechar?.()
      }
    }, tempoPorConquista)

    return () => clearTimeout(timer)
  }, [visivel, indiceAtual, conquistas, aoFechar])

  if (!visivel || conquistas.length === 0 || indiceAtual >= conquistas.length) {
    return null
  }

  const conquista = conquistas[indiceAtual]!
  const Icone = obterIcone(conquista.icone)

  return (
    <div className={styles.container}>
      <div className={styles.toast}>
        <div className={styles.iconeContainer}>
          <Icone className={styles.icone} size={28} />
        </div>
        <div className={styles.conteudo}>
          <span className={styles.tag}>🏆 Conquista desbloqueada!</span>
          <strong className={styles.nome}>{conquista.nome}</strong>
          <p className={styles.descricao}>{conquista.descricao}</p>
        </div>
        <button
          className={styles.botaoFechar}
          onClick={() => {
            if (indiceAtual < conquistas.length - 1) {
              setIndiceAtual((prev) => prev + 1)
            } else {
              setVisivel(false)
              aoFechar?.()
            }
          }}
          aria-label="Fechar"
        >
          ✕
        </button>
        {/* Barra de progresso */}
        <div className={styles.barraProgresso}>
          <div
            className={styles.preenchimento}
            style={{
              width: `${((indiceAtual + 1) / conquistas.length) * 100}%`,
              animation: `${styles.progredir} 4s linear forwards`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
