import Link from 'next/link'
import { Bot, Search, Lock } from 'lucide-react'
import styles from './page.module.css'

interface OpcaoPartida {
  icone: React.ReactNode
  nome: string
  descricao: string
  href: string
  cor?: string
}

const opcoes: OpcaoPartida[] = [
  {
    icone: <Bot size={36} />,
    nome: '🤖 Contra IA',
    descricao: 'Treine contra uma inteligência artificial. Perfeito para praticar e testar estratégias.',
    href: '/partida-rapida-ia',
  },
  {
    icone: <Search size={36} />,
    nome: '⚔️ Procurar Partida',
    descricao: 'Entre na fila e encontre um oponente ao vivo do seu nivel.',
    href: '/partida-rapida/fila',
  },
  {
    icone: <Lock size={36} />,
    nome: '🔑 Sala Privada',
    descricao: 'Crie ou entre em uma sala com um código. Jogue com amigos.',
    href: '/salas-privadas',
  },
]

export default function PaginaPartidaRapida() {
  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <h1 className={styles.titulo}>Partida Rápida</h1>
        <p className={styles.subtitulo}>
          Escolha como quer jogar
        </p>

        <div className={styles.opcoes}>
          {opcoes.map((opcao) => (
            <Link
              key={opcao.nome}
              href={opcao.href}
              className={styles.card}
            >
              <div className={styles.cardIcone}>{opcao.icone}</div>
              <div className={styles.cardInfo}>
                <h2 className={styles.cardNome}>{opcao.nome}</h2>
                <p className={styles.cardDescricao}>{opcao.descricao}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
