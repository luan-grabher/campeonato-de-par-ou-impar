import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import FormularioDeInicioPartida from './FormularioDeInicioPartida'
import styles from './partida-rapida-ia.module.css'

export default function PaginaInicioPartidaContraIa(): ReactNode {
  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <Link
          href="/partida-rapida"
          className={styles.voltar}
        >
          <ArrowLeft size={20} />
          Voltar
        </Link>

        <div className={styles.cabecalho}>
          <h1 className={styles.titulo}>🤖 Partida contra IA</h1>
          <p className={styles.descricao}>
            Treine suas habilidades contra uma inteligência artificial.
            Melhor de 3 rodadas, sem necessidade de login!
          </p>
        </div>

        <FormularioDeInicioPartida />
      </div>
    </div>
  )
}
