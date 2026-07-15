import Link from 'next/link'
import styles from './Cabecalho.module.css'

export default function Cabecalho() {
  return (
    <header className={styles.cabecalho}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoPar}>PAR</span>
          <span className={styles.logoOu}>ou</span>
          <span className={styles.logoImpar}>ÍMPAR</span>
        </Link>

        {/* Navegação */}
        <nav className={styles.navegacao}>
          <Link href="/" className={styles.link}>
            Início
          </Link>
          <Link href="/#como-funciona" className={styles.link}>
            Como Funciona
          </Link>
          <Link href="/#ranking" className={styles.link}>
            Ranking
          </Link>
        </nav>

        {/* Ações */}
        <div className={styles.acoes}>
          <Link href="/login" className={styles.linkEntrar}>
            Entrar
          </Link>
          <Link href="/cadastro" className={styles.botaoJogar}>
            Jogar Agora
          </Link>
        </div>
      </div>
    </header>
  )
}
