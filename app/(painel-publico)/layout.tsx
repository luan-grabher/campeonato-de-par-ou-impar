import Cabecalho from '@/componentes/layout/Cabecalho'
import Rodape from '@/componentes/layout/Rodape'
import type { ReactNode } from 'react'

export default function LayoutPainelPublico({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <Cabecalho />
      <main className="conteudo-publico">{children}</main>
      <Rodape />
    </>
  )
}
