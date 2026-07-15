'use client'

import { useAutenticacao } from './ProvedorDeAutenticacao'
import Cabecalho from './Cabecalho'
import CabecalhoLogado from './CabecalhoLogado'

export default function CabecalhoAutenticavel() {
  const { jogador, carregando } = useAutenticacao()

  if (carregando) return null

  if (jogador) return <CabecalhoLogado />

  return <Cabecalho />
}
