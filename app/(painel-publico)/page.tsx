import Link from 'next/link'
import styles from './page.module.css'

export default function PaginaInicial() {
  return (
    <div className={styles.hero}>
      <div className={styles.conteudo}>
        {/* Logo gigante */}
        <h1 className={styles.titulo}>
          <span className={styles.par}>PAR</span>{' '}
          <span className={styles.ou}>ou</span>{' '}
          <span className={styles.impar}>ÍMPAR</span>
        </h1>

        <p className={styles.subtitulo}>
          O meme brasileiro virou realidade. Partidas rápidas, competitivas,
          com ranking Elo e campeonatos ao vivo!
        </p>

        <div className={styles.acoes}>
          <Link href="/cadastro" className={styles.botaoPrimario}>
            Jogar Agora
          </Link>
          <Link href="/login" className={styles.botaoSecundario}>
            Já tenho conta
          </Link>
        </div>

        {/* Recursos */}
        <div className={styles.recursos}>
          <div className={styles.recurso}>
            <span className={styles.iconeRecurso}>🎮</span>
            <h3>Partidas Rápidas</h3>
            <p>Jogue em segundos contra oponentes reais</p>
          </div>
          <div className={styles.recurso}>
            <span className={styles.iconeRecurso}>🏆</span>
            <h3>Campeonatos</h3>
            <p>Competições ao vivo com premiação</p>
          </div>
          <div className={styles.recurso}>
            <span className={styles.iconeRecurso}>📊</span>
            <h3>Ranking Elo</h3>
            <p>Sistema de faixas para medir sua habilidade</p>
          </div>
        </div>
      </div>
    </div>
  )
}
