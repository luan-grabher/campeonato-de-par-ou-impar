'use client'

import { useRouter } from 'next/navigation'
import { Trophy, Users, Clock, CheckCircle, Play, XCircle } from 'lucide-react'
import type { CampeonatoAtivo } from '@/servidor/acoes/buscarCampeonatosAtivos'
import Botao from '@/componentes/ui/Botao'
import styles from './ListaDeCampeonatos.module.css'

interface ListaDeCampeonatosProps {
  campeonatos: CampeonatoAtivo[]
  idDoUsuario: string | null
  onInscrever: (id: string) => Promise<void>
  onCancelarInscricao: (id: string) => Promise<void>
  carregandoId: string | null
}

function formatarStatus(status: string): { rotulo: string; className: string } {
  switch (status) {
    case 'inscricoes_abertas':
      return { rotulo: 'Inscrições Abertas', className: styles.statusAberto ?? '' }
    case 'em_andamento':
      return { rotulo: 'Em Andamento', className: styles.statusAndamento ?? '' }
    case 'finalizado':
      return { rotulo: 'Finalizado', className: styles.statusFinalizado ?? '' }
    case 'cancelado':
      return { rotulo: 'Cancelado', className: styles.statusCancelado ?? '' }
    default:
      return { rotulo: status, className: '' }
  }
}

export default function ListaDeCampeonatos({
  campeonatos,
  idDoUsuario,
  onInscrever,
  onCancelarInscricao,
  carregandoId,
}: ListaDeCampeonatosProps) {
  const router = useRouter()

  if (campeonatos.length === 0) {
    return (
      <div className={styles.vazio}>
        <Trophy className={styles.vazioIcone} size={48} />
        <p className={styles.vazioTexto}>Nenhum campeonato disponível no momento.</p>
      </div>
    )
  }

  return (
    <div className={styles.grade}>
      {campeonatos.map((campeonato) => {
        const statusInfo = formatarStatus(campeonato.status)
        const vagasRestantes = campeonato.totalDeJogadores - campeonato.totalDeInscritos
        const podeInscrever = campeonato.status === 'inscricoes_abertas' && !campeonato.inscrito && vagasRestantes > 0
        const podeCancelar = campeonato.status === 'inscricoes_abertas' && campeonato.inscrito

        return (
          <div
            key={campeonato.id}
            className={styles.card}
            onClick={() => router.push(`/campeonatos/${campeonato.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                router.push(`/campeonatos/${campeonato.id}`)
              }
            }}
          >
            <div className={styles.cardCabecalho}>
              <h3 className={styles.cardNome}>{campeonato.nome}</h3>
              <span className={`${styles.status} ${statusInfo.className}`}>
                {statusInfo.rotulo}
              </span>
            </div>

            <div className={styles.cardInfo}>
              <div className={styles.infoItem}>
                <Users size={16} />
                <span>
                  {campeonato.totalDeInscritos}/{campeonato.totalDeJogadores} jogadores
                </span>
              </div>
              <div className={styles.infoItem}>
                <Trophy size={16} />
                <span>Mata-mata</span>
              </div>
              <div className={styles.infoItem}>
                <Clock size={16} />
                <span>
                  {new Date(campeonato.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {campeonato.status === 'inscricoes_abertas' && (
              <div className={styles.vagas}>
                <span className={vagasRestantes <= 3 ? styles.vagasCriticas : ''}>
                  {vagasRestantes} {vagasRestantes === 1 ? 'vaga restante' : 'vagas restantes'}
                </span>
              </div>
            )}

            <div className={styles.cardAcoes}>
              {podeInscrever && (
                <Botao
                  tamanho="pequeno"
                  onClick={async (e) => {
                    e.stopPropagation()
                    await onInscrever(campeonato.id)
                  }}
                  carregando={carregandoId === campeonato.id}
                >
                  <CheckCircle size={14} /> Inscrever-se
                </Botao>
              )}

              {podeCancelar && (
                <Botao
                  variante="ghost"
                  tamanho="pequeno"
                  onClick={async (e) => {
                    e.stopPropagation()
                    await onCancelarInscricao(campeonato.id)
                  }}
                  carregando={carregandoId === campeonato.id}
                >
                  <XCircle size={14} /> Cancelar Inscrição
                </Botao>
              )}

              {campeonato.inscrito && campeonato.status !== 'inscricoes_abertas' && (
                <span className={styles.inscrito}>
                  <CheckCircle size={14} /> Inscrito
                </span>
              )}

              {campeonato.status === 'em_andamento' && (
                <Botao tamanho="pequeno" onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/campeonatos/${campeonato.id}`)
                }}>
                  <Play size={14} /> Ver Chaveamento
                </Botao>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
