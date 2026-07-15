import Link from 'next/link'
import {
  Zap,
  Bot,
  Skull,
  Trophy,
  Lock,
  type LucideIcon,
} from 'lucide-react'
import styles from './page.module.css'

interface ModoDeJogo {
  icone: LucideIcon
  nome: string
  descricao: string
  href: string
  cor: string
  destaque?: boolean
}

const modosDeJogo: ModoDeJogo[] = [
  {
    icone: Zap,
    nome: 'Partida Rápida',
    descricao:
      'Encontre oponentes ao vivo no seu nível. Partidas dinâmicas de par ou ímpar para subir no ranking.',
    href: '/partida-rapida',
    cor: '#7c5cff',
    destaque: true,
  },
  {
    icone: Bot,
    nome: 'Contra IA',
    descricao:
      'Treine suas estratégias contra uma inteligência artificial. Sem pressão, sem espera.',
    href: '/partida-rapida-ia',
    cor: '#00d4aa',
  },
  {
    icone: Skull,
    nome: 'Sobrevivência',
    descricao:
      'Quantas rodadas você consegue vencer consecutivamente? Um erro e você volta ao início.',
    href: '/modo-sobrevivencia',
    cor: '#ff5e7a',
  },
  {
    icone: Trophy,
    nome: 'Campeonatos',
    descricao:
      'Participe de torneios organizados, avance nas chaves e prove que é o melhor.',
    href: '/campeonatos',
    cor: '#ffc857',
  },
  {
    icone: Lock,
    nome: 'Sala Privada',
    descricao:
      'Crie ou entre em uma sala com código. Desafie amigos em partidas exclusivas.',
    href: '/salas-privadas',
    cor: '#4fc4ff',
  },
]

export default function PaginaJogar() {
  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        {/* Cabeçalho */}
        <div className={styles.cabecalho}>
          <h1 className={styles.titulo}>Como você quer jogar hoje?</h1>
          <p className={styles.subtitulo}>
            Escolha um modo de jogo e entre na ação
          </p>
        </div>

        {/* Grid de modos */}
        <div className={styles.grid}>
          {modosDeJogo.map((modo) => (
            <Link
              key={modo.nome}
              href={modo.href}
              className={`${styles.card} ${modo.destaque ? styles.cardDestaque : ''}`}
              style={
                {
                  '--corDoModo': modo.cor,
                } as React.CSSProperties
              }
            >
              <div className={styles.cardGlow} />
              <div className={styles.cardConteudo}>
                <div
                  className={styles.cardIcone}
                  style={{ background: `${modo.cor}1a` }}
                >
                  <modo.icone size={28} strokeWidth={1.5} />
                </div>
                <div className={styles.cardInfo}>
                  <h2 className={styles.cardNome}>{modo.nome}</h2>
                  <p className={styles.cardDescricao}>{modo.descricao}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
