'use client'

import { useRouter } from 'next/navigation'
import { Trophy, Swords, Loader2 } from 'lucide-react'
import type { FaseDoChaveamento, PartidaDoChaveamento } from '@/servidor/acoes/buscarChaveamentoDoCampeonato'
import styles from './ChaveamentoDoCampeonato.module.css'

interface ChaveamentoDoCampeonatoProps {
  fases: FaseDoChaveamento[]
  idDoUsuario: string | null
  participante: boolean
  status: string
}

function StatusDaPartida({ status }: { status: string }) {
  switch (status) {
    case 'aguardando_jogadores':
      return <span className={styles.statusAguardando}>Aguardando</span>
    case 'em_andamento':
      return <span className={styles.statusAndamento}>Em andamento</span>
    case 'finalizada':
      return <span className={styles.statusFinalizada}>Finalizada</span>
    case 'cancelada':
      return <span className={styles.statusCancelada}>Cancelada</span>
    default:
      return null
  }
}

function PartidaCard({
  partida,
  idDoUsuario,
}: {
  partida: PartidaDoChaveamento
  idDoUsuario: string | null
}) {
  const router = useRouter()
  const jogador1EhUsuario = partida.idDoPrimeiroJogador === idDoUsuario
  const jogador2EhUsuario = partida.idDoSegundoJogador === idDoUsuario
  const vencedor1 = partida.vencedorId === partida.idDoPrimeiroJogador
  const vencedor2 = partida.vencedorId === partida.idDoSegundoJogador
  const finalizada = partida.status === 'finalizada'
  const podeJogar = partida.idDoPrimeiroJogador && partida.idDoSegundoJogador && partida.status === 'aguardando_jogadores'
  const emAndamento = partida.status === 'em_andamento'

  return (
    <div
      className={`${styles.partida} ${finalizada ? styles.partidaFinalizada : ''} ${emAndamento ? styles.partidaAndamento : ''}`}
      onClick={() => {
        if (partida.idDoPrimeiroJogador && partida.idDoSegundoJogador) {
          router.push(`/partida-rapida/jogo/${partida.id}`)
        }
      }}
      role="button"
      tabIndex={partida.idDoPrimeiroJogador && partida.idDoSegundoJogador ? 0 : -1}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && partida.idDoPrimeiroJogador && partida.idDoSegundoJogador) {
          router.push(`/partida-rapida/jogo/${partida.id}`)
        }
      }}
    >
      <div className={styles.jogadores}>
        <div className={`${styles.jogador} ${jogador1EhUsuario ? styles.jogadorDestaque : ''} ${vencedor1 ? styles.vencedor : styles.perdedor}`}>
          <span className={styles.jogadorNome}>
            {partida.nomeDoPrimeiroJogador || <span className={styles.placeholder}>—</span>}
          </span>
          {jogador1EhUsuario && <span className={styles.voceTag}>você</span>}
          {vencedor1 && <Trophy size={12} className={styles.trofeu} />}
        </div>
        <div className={styles.divisor}>
          <span className={styles.placarTexto}>vs</span>
        </div>
        <div className={`${styles.jogador} ${jogador2EhUsuario ? styles.jogadorDestaque : ''} ${vencedor2 ? styles.vencedor : styles.perdedor}`}>
          <span className={styles.jogadorNome}>
            {partida.nomeDoSegundoJogador || <span className={styles.placeholder}>—</span>}
          </span>
          {jogador2EhUsuario && <span className={styles.voceTag}>você</span>}
          {vencedor2 && <Trophy size={12} className={styles.trofeu} />}
        </div>
      </div>

      <div className={styles.partidaFooter}>
        <StatusDaPartida status={partida.status} />
        {podeJogar && (
          <span className={styles.prontoParaJogar}>
            <Swords size={12} /> Jogar
          </span>
        )}
        {emAndamento && (
          <span className={styles.prontoParaJogar}>
            <Loader2 size={12} className={styles.spinning} /> Em jogo
          </span>
        )}
      </div>
    </div>
  )
}

export default function ChaveamentoDoCampeonato({
  fases,
  idDoUsuario,
  participante,
  status,
}: ChaveamentoDoCampeonatoProps) {
  if (fases.length === 0) {
    return (
      <div className={styles.semDados}>
        <Trophy size={48} className={styles.semDadosIcone} />
        <p>Chaveamento não disponível.</p>
      </div>
    )
  }

  return (
    <div className={styles.chaveamento}>
      {status === 'inscricoes_abertas' && (
        <div className={styles.avisoInscricoes}>
          <p>As inscrições ainda estão abertas. O chaveamento será gerado quando o campeonato iniciar.</p>
        </div>
      )}

      <div className={styles.bracket}>
        {fases.map((fase) => (
          <div key={fase.numero} className={styles.fase}>
            <div className={styles.faseCabecalho}>
              <h3 className={styles.faseNome}>{fase.nome}</h3>
              {fase.partidas.length > 0 && (
                <span className={styles.fasePartidas}>
                  {fase.partidas.length} {fase.partidas.length === 1 ? 'partida' : 'partidas'}
                </span>
              )}
            </div>

            <div className={styles.fasePartidas}>
              {fase.partidas.length > 0 ? (
                fase.partidas.map((partida) => (
                  <div key={partida.id} className={styles.partidaWrapper}>
                    <PartidaCard
                      partida={partida}
                      idDoUsuario={idDoUsuario}
                    />
                    {/* Linha de conexão para próxima fase (exceto última fase) */}
                    {fase.numero < fases.length && (
                      <div className={styles.conector} aria-hidden="true" />
                    )}
                  </div>
                ))
              ) : (
                <div className={styles.faseVazia}>
                  <span className={styles.faseVaziaTexto}>Aguardando...</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legenda */}
      {participante && (
        <div className={styles.legenda}>
          <div className={styles.legendaItem}>
            <span className={styles.legendaCorDestaque} /> Você
          </div>
          <div className={styles.legendaItem}>
            <Trophy size={12} /> Vencedor
          </div>
        </div>
      )}
    </div>
  )
}
