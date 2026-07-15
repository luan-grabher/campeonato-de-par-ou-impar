import Link from 'next/link'
import styles from './Rodape.module.css'

export default function Rodape() {
  return (
    <footer className={styles.rodape}>
      <div className={styles.container}>
        <div className={styles.colunas}>
          {/* Marca */}
          <div className={styles.coluna}>
            <h3 className={styles.titulo}>Par ou Ímpar Online</h3>
            <p className={styles.descricao}>
              O meme virou realidade — partidas rápidas de Par ou Ímpar com
              ranking, campeonatos e IA!
            </p>
          </div>

          {/* Links */}
          <div className={styles.coluna}>
            <h4 className={styles.tituloColuna}>Links</h4>
            <nav className={styles.links}>
              <Link href="/#como-funciona" className={styles.link}>
                Sobre
              </Link>
              <Link href="/termos" className={styles.link}>
                Termos de Uso
              </Link>
              <Link href="/contato" className={styles.link}>
                Contato
              </Link>
            </nav>
          </div>
        </div>

        <div className={styles.rodapeFinal}>
          <p className={styles.direitos}>
            &copy; {new Date().getFullYear()} Par ou Ímpar Online. Todos os
            direitos reservados.
          </p>
          <p className={styles.feitoCom}>Feito com 💜 no Brasil</p>
        </div>
      </div>
    </footer>
  )
}
