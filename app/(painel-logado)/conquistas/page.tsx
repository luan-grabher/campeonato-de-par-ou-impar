import { Trophy } from 'lucide-react'
import { buscarTodasAsConquistas } from '@/servidor/acoes/buscarTodasAsConquistas'
import { buscarConquistasDoJogador } from '@/servidor/acoes/buscarConquistasDoJogador'
import ListaDeConquistas from '@/componentes/jogo/ListaDeConquistas'
import styles from './page.module.css'

export default async function PaginaConquistas() {
  const [{ conquistas }, { conquistas: conquistasDoJogador }] = await Promise.all([
    buscarTodasAsConquistas(),
    buscarConquistasDoJogador(),
  ])

  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <h1 className={styles.titulo}>🏆 Conquistas</h1>
        <p className={styles.subtitulo}>
          Desbloqueie conquistas jogando partidas e participando de campeonatos
        </p>

        <div className={styles.contador}>
          <Trophy className={styles.iconeContador} size={18} />
          <span>
            {conquistasDoJogador.length} / {conquistas.length} conquistas
            desbloqueadas
          </span>
        </div>

        <ListaDeConquistas
          conquistas={conquistas}
          conquistasDoJogador={conquistasDoJogador}
        />
      </div>
    </div>
  )
}
