'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Zap,
  Trophy,
  Users,
  BarChart3,
  User,
  HeartHandshake,
  History,
  Skull,
  Award,
  ShoppingBag,
  Backpack,
  type LucideIcon,
} from 'lucide-react'
import styles from './BarraDeNavegacao.module.css'

interface LinkNav {
  href: string
  icone: LucideIcon
  rotulo: string
}

const links: LinkNav[] = [
  { href: '/partida-rapida', icone: Zap, rotulo: 'Jogar' },
  { href: '/modo-sobrevivencia', icone: Skull, rotulo: 'Sobrevivência' },
  { href: '/conquistas', icone: Award, rotulo: 'Conquistas' },
  { href: '/partidas', icone: History, rotulo: 'Partidas' },
  { href: '/campeonatos', icone: Trophy, rotulo: 'Campeonatos' },
  { href: '/salas-privadas', icone: Users, rotulo: 'Salas Privadas' },
  { href: '/loja', icone: ShoppingBag, rotulo: 'Loja' },
  { href: '/inventario', icone: Backpack, rotulo: 'Inventário' },
  { href: '/ranking', icone: BarChart3, rotulo: 'Ranking' },
  { href: '/perfil', icone: User, rotulo: 'Perfil' },
  { href: '/amigos', icone: HeartHandshake, rotulo: 'Amigos' },
]

export default function BarraDeNavegacao() {
  const caminhoAtual = usePathname()

  return (
    <>
      {/* Sidebar — Desktop */}
      <aside className={styles.sidebar}>
        <nav className={styles.nav}>
          {links.map((link) => {
            const ativo = caminhoAtual.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.link} ${ativo ? styles.ativo : ''}`}
              >
                <link.icone className={styles.icone} size={20} />
                <span className={styles.rotulo}>{link.rotulo}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Barra Inferior — Mobile */}
      <nav className={styles.barraInferior}>
        {links.map((link) => {
          const ativo = caminhoAtual.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.linkInferior} ${ativo ? styles.ativoInferior : ''}`}
            >
              <link.icone className={styles.iconeInferior} size={22} />
              <span className={styles.rotuloInferior}>{link.rotulo}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
