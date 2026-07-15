import { buscarInventarioDoJogador } from '@/servidor/acoes/buscarInventarioDoJogador'
import InventarioDeCosmeticos from '@/componentes/jogo/InventarioDeCosmeticos'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function PaginaInventario() {
  const resultado = await buscarInventarioDoJogador()

  if ('erro' in resultado) {
    return (
      <div className={styles.container}>
        <h1 className={styles.titulo}>Inventário</h1>
        <p className={styles.erro}>{resultado.erro}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.cabecalho}>
        <h1 className={styles.titulo}>Meu Inventário</h1>
        <p className={styles.subtitulo}>
          Gerencie seus cosméticos e equipe-os como preferir.
        </p>
      </div>

      <InventarioDeCosmeticos cosmeticos={resultado} />
    </div>
  )
}
