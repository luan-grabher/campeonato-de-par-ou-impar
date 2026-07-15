import CabecalhoAutenticavel from '@/componentes/layout/CabecalhoAutenticavel'
import Rodape from '@/componentes/layout/Rodape'
import type { ReactNode } from 'react'

export default function LayoutPainelPublico({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <CabecalhoAutenticavel />
      <main className="conteudo-publico">{children}</main>
      <Rodape />
    </>
  )
}
