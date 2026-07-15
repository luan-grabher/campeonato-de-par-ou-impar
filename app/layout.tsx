import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import ProvedorDeAutenticacao from '@/componentes/layout/ProvedorDeAutenticacao'

export const metadata: Metadata = {
  title: 'Campeonato de Par ou Ímpar Online',
  description:
    'O meme virou realidade — partidas rápidas de Par ou Ímpar com ranking, campeonatos e IA!',
}

export default function LayoutRaiz({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ProvedorDeAutenticacao>{children}</ProvedorDeAutenticacao>
      </body>
    </html>
  )
}
