import { Shield, type LucideIcon } from 'lucide-react'
import styles from './BadgeDeElo.module.css'

type FaixaElo =
  | 'ferro'
  | 'bronze'
  | 'prata'
  | 'ouro'
  | 'platina'
  | 'diamante'
  | 'mestre'
  | 'lendario'

interface BadgeDeEloProps {
  faixa: FaixaElo | string
  icone?: LucideIcon
  className?: string
}

const rotulos: Record<FaixaElo, string> = {
  ferro: 'Ferro',
  bronze: 'Bronze',
  prata: 'Prata',
  ouro: 'Ouro',
  platina: 'Platina',
  diamante: 'Diamante',
  mestre: 'Mestre',
  lendario: 'Lendário',
}

const icones: Record<FaixaElo, LucideIcon> = {
  ferro: Shield,
  bronze: Shield,
  prata: Shield,
  ouro: Shield,
  platina: Shield,
  diamante: Shield,
  mestre: Shield,
  lendario: Shield,
}

export default function BadgeDeElo({
  faixa,
  icone: iconeExterno,
  className = '',
}: BadgeDeEloProps) {
  const faixaNormalizada = faixa.toLowerCase() as FaixaElo
  const rotulo = rotulos[faixaNormalizada] ?? faixa
  const Icone = iconeExterno ?? icones[faixaNormalizada] ?? Shield

  return (
    <span
      className={`${styles.badge} ${styles[faixaNormalizada] || ''} ${className}`}
      title={rotulo}
    >
      <Icone className={styles.icone} aria-hidden="true" />
      {rotulo}
    </span>
  )
}
