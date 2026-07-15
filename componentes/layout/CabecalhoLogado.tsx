'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  User,
  Settings,
  HeartHandshake,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useAutenticacao } from './ProvedorDeAutenticacao'
import BadgeDeElo from '@/componentes/ui/BadgeDeElo'
import styles from './CabecalhoLogado.module.css'

export default function CabecalhoLogado() {
  const { jogador, sair } = useAutenticacao()
  const [aberto, setAberto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  /* Fecha o menu ao clicar fora */
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!jogador) {
    return (
      <header className={styles.cabecalho}>
        <div className={styles.container}>
          <Link href="/jogar" className={styles.logo}>
            <span className={styles.logoPar}>PAR</span>
            <span className={styles.logoOu}>ou</span>
            <span className={styles.logoImpar}>ÍMPAR</span>
          </Link>
          <div className={styles.perfilPlaceholder} aria-hidden="true" />
        </div>
      </header>
    )
  }

  return (
    <header className={styles.cabecalho}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/jogar" className={styles.logo}>
          <span className={styles.logoPar}>PAR</span>
          <span className={styles.logoOu}>ou</span>
          <span className={styles.logoImpar}>ÍMPAR</span>
        </Link>

        {/* Perfil / Dropdown */}
        <div className={styles.perfil} ref={menuRef}>
          <button
            className={styles.botaoPerfil}
            onClick={() => setAberto(!aberto)}
            aria-expanded={aberto}
            aria-haspopup="true"
          >
            <div className={styles.avatar}>
              {jogador.avatar_url ? (
                <img
                  src={jogador.avatar_url}
                  alt=""
                  className={styles.avatarImagem}
                />
              ) : (
                <span className={styles.avatarPlaceholder}>
                  {jogador.apelido.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className={styles.nome}>{jogador.apelido}</span>
            <BadgeDeElo faixa={jogador.elo} />
            <ChevronDown
              className={`${styles.chevron} ${aberto ? styles.chevronAberto : ''}`}
              size={16}
            />
          </button>

          {/* Menu Dropdown */}
          {aberto && (
            <div className={styles.dropdown}>
              <Link
                href="/perfil"
                className={styles.itemDropdown}
                onClick={() => setAberto(false)}
              >
                <User size={16} />
                Perfil
              </Link>
              <Link
                href="/amigos"
                className={styles.itemDropdown}
                onClick={() => setAberto(false)}
              >
                <HeartHandshake size={16} />
                Amigos
              </Link>
              <Link
                href="/configuracoes"
                className={styles.itemDropdown}
                onClick={() => setAberto(false)}
              >
                <Settings size={16} />
                Configurações
              </Link>
              <hr className={styles.divisao} />
              <button
                className={styles.itemDropdown}
                onClick={() => {
                  setAberto(false)
                  sair()
                }}
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
