'use client'

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
  Lock,
  type LucideIcon,
} from 'lucide-react'
import type { Conquista } from '@/servidor/acoes/buscarTodasAsConquistas'
import type { ConquistaDesbloqueada } from '@/servidor/acoes/buscarConquistasDoJogador'
import styles from './ListaDeConquistas.module.css'

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

interface ListaDeConquistasProps {
  conquistas: Conquista[]
  conquistasDoJogador: ConquistaDesbloqueada[]
}

export default function ListaDeConquistas({
  conquistas,
  conquistasDoJogador,
}: ListaDeConquistasProps) {
  const idsDesbloqueadas = new Set(conquistasDoJogador.map((c) => c.id_da_conquista))

  return (
    <div className={styles.grid}>
      {conquistas.map((conquista) => {
        const desbloqueada = idsDesbloqueadas.has(conquista.id)
        const Icone = obterIcone(conquista.icone)

        return (
          <div
            key={conquista.id}
            className={`${styles.cartao} ${desbloqueada ? styles.desbloqueada : styles.trancada}`}
          >
            <div className={styles.iconeContainer}>
              {desbloqueada ? (
                <Icone className={styles.icone} size={32} />
              ) : (
                <div className={styles.iconeTrancado}>
                  <Icone className={styles.iconeDesbotado} size={28} />
                  <Lock className={styles.cadeado} size={14} />
                </div>
              )}
            </div>
            <div className={styles.info}>
              <h3 className={styles.nome}>{conquista.nome}</h3>
              <p className={styles.descricao}>{conquista.descricao}</p>
            </div>
            {desbloqueada && (
              <span className={styles.seloDesbloqueada}>✓</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
