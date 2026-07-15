import CabecalhoLogado from '@/componentes/layout/CabecalhoLogado'
import BarraDeNavegacao from '@/componentes/layout/BarraDeNavegacao'
import BannerDeTemporada from '@/componentes/jogo/BannerDeTemporada'
import Rodape from '@/componentes/layout/Rodape'
import type { ReactNode } from 'react'
import styles from './layout.module.css'

export default function LayoutPainelLogado({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className={styles.wrapper}>
      <CabecalhoLogado />
      <div className={styles.corpo}>
        <BannerDeTemporada />
        <div className={styles.container}>
          <BarraDeNavegacao />
          <main className={styles.conteudo}>{children}</main>
        </div>
      </div>
      <Rodape />
    </div>
  )
}
