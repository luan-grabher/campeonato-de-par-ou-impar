'use client'

import Link from 'next/link'
import { Trophy, Frown, RotateCcw, User, Play } from 'lucide-react'
import Botao from '@/componentes/ui/Botao'
import BadgeDeElo from '@/componentes/ui/BadgeDeElo'
import EfeitoDeVitoria from '@/componentes/ui/EfeitoDeVitoria'
import styles from './ResultadoFinalDaPartida.module.css'

interface ResultadoFinalDaPartidaProps {
  venceu: boolean
  eloGanho: number
  eloPerdido: number
  novoElo: number
  pontuacaoJogador: number
  pontuacaoOponente: number
  nomeOponente: string
  idDaPartida: string
  onJogarNovamente: () => void
  onVerPerfil: () => void
}

export default function ResultadoFinalDaPartida({
  venceu,
  eloGanho,
  eloPerdido,
  novoElo,
  pontuacaoJogador,
  pontuacaoOponente,
  nomeOponente,
  idDaPartida,
  onJogarNovamente,
  onVerPerfil,
}: ResultadoFinalDaPartidaProps) {
  return (
    <div className={styles.container}>
      <EfeitoDeVitoria venceu={venceu} ativo />

      <div className={styles.card}>
        <div className={styles.icone}>
          {venceu ? (
            <Trophy size={64} className={styles.iconeVitoria} />
          ) : (
            <Frown size={64} className={styles.iconeDerrota} />
          )}
        </div>

        <h1 className={`${styles.titulo} ${venceu ? styles.vitoria : styles.derrota}`}>
          {venceu ? 'Vitória!' : 'Derrota!'}
        </h1>

        <p className={styles.subtitulo}>
          {venceu
            ? `Você venceu ${nomeOponente} por ${pontuacaoJogador} a ${pontuacaoOponente}!`
            : `Você perdeu para ${nomeOponente} por ${pontuacaoOponente} a ${pontuacaoJogador}.`}
        </p>

        <div className={styles.placar}>
          <div className={styles.placarItem}>
            <span className={styles.placarLabel}>Você</span>
            <span className={`${styles.placarValor} ${venceu ? styles.vitoria : styles.derrota}`}>
              {pontuacaoJogador}
            </span>
          </div>
          <span className={styles.placarDivisor}>x</span>
          <div className={styles.placarItem}>
            <span className={styles.placarLabel}>{nomeOponente}</span>
            <span className={`${styles.placarValor} ${!venceu ? styles.vitoria : styles.derrota}`}>
              {pontuacaoOponente}
            </span>
          </div>
        </div>

        <div className={styles.eloContainer}>
          <span className={styles.eloLabel}>Novo Elo</span>
          <span className={styles.eloValor}>{novoElo}</span>
          <BadgeDeElo faixa={novoElo >= 2000 ? 'diamante' : novoElo >= 1500 ? 'ouro' : novoElo >= 1000 ? 'prata' : 'bronze'} />
          <span className={styles.eloAlteracao}>
            {venceu ? '+' : ''}
            {venceu ? eloGanho : -eloPerdido} elo
          </span>
        </div>

        <div className={styles.acoes}>
          <Botao
            onClick={onJogarNovamente}
            tamanho="grande"
            larguraTotal
          >
            <RotateCcw size={18} />
            Jogar Novamente
          </Botao>

          <div className={styles.acoesSecundarias}>
            <Botao
              onClick={onVerPerfil}
              variante="secundario"
              larguraTotal
            >
              <User size={18} />
              Ver Perfil
            </Botao>

            <Link href={`/partidas/${idDaPartida}/replay`}>
              <Botao
                variante="secundario"
                larguraTotal
              >
                <Play size={18} />
                Ver Replay
              </Botao>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
