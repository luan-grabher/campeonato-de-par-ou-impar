'use client'

import Link from 'next/link'
import { Trophy, Frown, Minus, ChevronRight, Clock, Swords, Users, Award } from 'lucide-react'
import type { PartidaNoHistorico } from '@/servidor/acoes/buscarHistoricoDePartidas'
import styles from './ItemDoHistorico.module.css'

interface ItemDoHistoricoProps {
  partida: PartidaNoHistorico
}

const mapaDeModos: Record<string, string> = {
  classico: 'Clássico',
  dificil: 'Difícil',
  relampago: 'Relâmpago',
  invisivel: 'Invisível',
  caos: 'Caos',
  sobrevivencia: 'Sobrevivência',
  partida_contra_ia: 'vs IA',
}

const mapaDeTipos: Record<string, { rotulo: string; icone: typeof Swords }> = {
  partida_rapida: { rotulo: 'Partida Rápida', icone: Swords },
  sala_privada: { rotulo: 'Sala Privada', icone: Users },
  campeonato: { rotulo: 'Campeonato', icone: Award },
}

function formatarData(iso: string): string {
  const data = new Date(iso)
  const agora = new Date()
  const diffEmMs = agora.getTime() - data.getTime()
  const diffEmDias = Math.floor(diffEmMs / (1000 * 60 * 60 * 24))

  if (diffEmDias === 0) {
    return `Hoje às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }

  if (diffEmDias === 1) {
    return `Ontem às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }

  if (diffEmDias < 7) {
    return `Há ${diffEmDias} dias`
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export default function ItemDoHistorico({ partida }: ItemDoHistoricoProps) {
  const {
    id,
    modo,
    tipo,
    resultado,
    adversario,
    eloGanho,
    eloPerdido,
    createdAt,
  } = partida

  const rotuloDoModo = mapaDeModos[modo] ?? modo
  const infoDoTipo = mapaDeTipos[tipo]
  const IconeDoTipo = infoDoTipo?.icone ?? Swords
  const dataFormatada = formatarData(createdAt)

  const iniciais = adversario.nome
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Link
      href={`/partidas/${id}/replay`}
      className={`${styles.card} ${styles[resultado]}`}
    >
      {/* Resultado */}
      <div className={styles.resultadoWrapper}>
        {resultado === 'vitoria' ? (
          <Trophy size={24} className={styles.iconeVitoria} />
        ) : resultado === 'derrota' ? (
          <Frown size={24} className={styles.iconeDerrota} />
        ) : (
          <Minus size={24} className={styles.iconeEmpate} />
        )}
        <span className={styles.resultadoTexto}>
          {resultado === 'vitoria'
            ? 'Vitória'
            : resultado === 'derrota'
              ? 'Derrota'
              : 'Empate'}
        </span>
      </div>

      {/* Adversário */}
      <div className={styles.adversarioWrapper}>
        <div className={styles.avatar}>
          {adversario.urlDoAvatar ? (
            <img
              src={adversario.urlDoAvatar}
              alt={adversario.nome}
              className={styles.avatarImagem}
            />
          ) : (
            <span className={styles.avatarIniciais}>{iniciais}</span>
          )}
        </div>
        <div className={styles.adversarioInfo}>
          <span className={styles.adversarioNome}>{adversario.nome}</span>
          <span className={styles.detalhes}>
            <IconeDoTipo size={12} />
            {infoDoTipo?.rotulo ?? tipo}
            {' · '}
            {rotuloDoModo}
          </span>
        </div>
      </div>

      {/* Elo */}
      <div className={styles.eloWrapper}>
        {resultado === 'vitoria' && eloGanho > 0 && (
          <span className={styles.eloGanho}>+{eloGanho}</span>
        )}
        {resultado === 'derrota' && eloPerdido > 0 && (
          <span className={styles.eloPerdido}>-{eloPerdido}</span>
        )}
        {resultado === 'empate' && (
          <span className={styles.eloNeutro}>—</span>
        )}
      </div>

      {/* Data */}
      <div className={styles.dataWrapper}>
        <Clock size={14} />
        <span className={styles.dataTexto}>{dataFormatada}</span>
      </div>

      {/* Seta */}
      <ChevronRight size={18} className={styles.seta} />
    </Link>
  )
}
