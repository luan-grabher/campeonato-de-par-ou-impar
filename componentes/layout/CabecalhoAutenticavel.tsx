'use client'

import { useAutenticacao } from './ProvedorDeAutenticacao'
import Cabecalho from './Cabecalho'
import CabecalhoLogado from './CabecalhoLogado'

interface CabecalhoAutenticavelProps {
  /** Hint do servidor: true se o cookie de sessão existe */
  usuarioLogadoInicial?: boolean
}

export default function CabecalhoAutenticavel({
  usuarioLogadoInicial = false,
}: CabecalhoAutenticavelProps) {
  const { jogador, carregando } = useAutenticacao()

  /* Estado definitivo (cliente já resolveu) */
  if (!carregando) {
    if (jogador) return <CabecalhoLogado />
    return <Cabecalho />
  }

  /* Ainda carregando — usa hint do servidor pra evitar flicker */
  if (usuarioLogadoInicial) return <CabecalhoLogado />

  return null
}
