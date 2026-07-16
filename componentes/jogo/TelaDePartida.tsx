'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PlacarDaPartida from '@/componentes/ui/PlacarDaPartida'
import SeletorDeNumero from '@/componentes/ui/SeletorDeNumero'
import SeletorDeParidade from '@/componentes/ui/SeletorDeParidade'
import CronometroDaRodada from '@/componentes/ui/CronometroDaRodada'
import AnimacaoDeRevelacao from '@/componentes/ui/AnimacaoDeRevelacao'
import Botao from '@/componentes/ui/Botao'
import { chamarApi } from '@/hooks/usarApiCliente'
import { usarAssinaturaRealtime } from '@/hooks/usarAssinaturaRealtime'
import { usarTimerRelampago } from '@/hooks/usarTimerRelampago'
import type { PerfilDoJogador } from '@/core/tipos/jogador'
import type { DadosDaPartida } from '@/core/tipos/partida'
import type { ModoDeJogo } from '@/core/tipos/partida'
import ResultadoFinalDaPartida from './ResultadoFinalDaPartida'
import styles from './TelaDePartida.module.css'

interface DadosDoOponente {
  id: string
  nome: string
  elo: number
  avatarUrl?: string | null
}

interface TelaDePartidaProps {
  partida: DadosDaPartida & { modo: string }
  jogador: PerfilDoJogador
  oponente: DadosDoOponente
  idDaPartida: string
}

type EstadoDoJogo =
  | 'aguardando_jogada'
  | 'jogada_enviada'
  | 'revelando_resultado'
  | 'partida_finalizada'

type DadosResultadoFinal = {
  vencedorId: string
  eloGanho: number
  eloPerdido: number
  novoEloVencedor: number
  novoEloPerdedor: number
  pontuacaoPrimeiro: number
  pontuacaoSegundo: number
}

/** Mapa de tempo limite por modo (em segundos) */
const TEMPO_LIMITE_POR_MODO: Record<string, number> = {
  classico: 30,
  dificil: 20,
  relampago: 5,
  invisivel: 30,
  caos: 15,
  sobrevivencia: 20,
}

/** Mapa de maxNumeros (intervalo superior) por modo */
const MAX_NUMEROS_POR_MODO: Record<string, number> = {
  classico: 2,
  dificil: 10,
  relampago: 2,
  invisivel: 10,
  caos: 20,
  sobrevivencia: 5,
}

/**
 * Gera um nome amigável para o modo de jogo.
 */
function nomearModo(modo: string): string {
  const mapa: Record<string, string> = {
    classico: 'Clássico',
    dificil: 'Difícil',
    relampago: '⚡ Relâmpago',
    invisivel: '👻 Invisível',
    caos: '🎲 Caos',
    sobrevivencia: 'Sobrevivência',
  }
  return mapa[modo] ?? modo
}

export default function TelaDePartida({
  partida,
  jogador,
  oponente,
  idDaPartida,
}: TelaDePartidaProps) {
  const router = useRouter()
  const ehPrimeiro = partida.idDoPrimeiroJogador === jogador.id
  const totalRodadas = partida.totalDeRodadasPrevisto ?? 3
  const modo = partida.modo
  const tempoLimite = TEMPO_LIMITE_POR_MODO[modo] ?? 30
  const maxNumeros = MAX_NUMEROS_POR_MODO[modo] ?? 2
  const ehRelampago = modo === 'relampago'
  const ehInvisivel = modo === 'invisivel'
  const ehCaos = modo === 'caos'

  const [numeroSelecionado, setNumeroSelecionado] = useState<number | null>(null)
  const [paridadeSelecionada, setParidadeSelecionada] = useState<'par' | 'impar' | null>(null)
  const [estadoJogo, setEstadoJogo] = useState<EstadoDoJogo>('aguardando_jogada')
  const [rodadaAtual, setRodadaAtual] = useState<number>(partida.rodadaAtual || 1)
  const [pontuacao, setPontuacao] = useState({ jogador: 0, oponente: 0 })
  const [ultimoResultado, setUltimoResultado] = useState<{
    numero: number
    paridade: 'par' | 'impar'
    venceu: boolean
    numeroOponente: number
    paridadeOponente: 'par' | 'impar'
  } | null>(null)
  const [resultadoFinal, setResultadoFinal] = useState<DadosResultadoFinal | null>(null)
  const tokenRef = useRef<string>(crypto.randomUUID())
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [intervaloAtual, setIntervaloAtual] = useState<string | null>(null)

  const { eventos, conectado } = usarAssinaturaRealtime(idDaPartida, jogador.id)

  // Hook do timer relâmpago
  const lidarTempoEsgotadoRelampago = useCallback(async () => {
    if (estadoJogo !== 'aguardando_jogada' || !numeroSelecionado) return

    setCarregando(true)
    setErro(null)
    setEstadoJogo('jogada_enviada')

    // No timeout, enviar jogada aleatória
    const numeroAleatorio = numeroSelecionado ?? Math.floor(Math.random() * 2) + 1
    const paridadeAleatoria = paridadeSelecionada ?? (Math.random() < 0.5 ? 'par' : 'impar')

    const resultado = await chamarApi<{ status: string; mensagem?: string }>(
      '/api/partidas/confirmar-jogada-relampago',
      {
        idDaPartida,
        numeroDaRodada: rodadaAtual,
        numeroEscolhido: numeroAleatorio,
        paridadeEscolhida: paridadeAleatoria,
        tokenDeIdempotencia: tokenRef.current,
        timeoutNoCliente: true,
      }
    )

    setCarregando(false)

    if (resultado.status === 'erro') {
      setErro(resultado.mensagem ?? 'Erro ao confirmar jogada.')
      setEstadoJogo('aguardando_jogada')
      return
    }
  }, [estadoJogo, numeroSelecionado, paridadeSelecionada, idDaPartida, rodadaAtual])

  const {
    restante: tempoRelampagoRestante,
    alerta: tempoRelampagoAlerta,
  } = usarTimerRelampago({
    segundos: tempoLimite,
    emExecucao: ehRelampago && estadoJogo === 'aguardando_jogada',
    onTempoEsgotado: lidarTempoEsgotadoRelampago,
  })

  // Efeito para processar eventos Realtime
  useEffect(() => {
    if (eventos.length === 0) return

    const ultimoEvento = eventos[eventos.length - 1]
    if (!ultimoEvento) return

    switch (ultimoEvento.tipo) {
      case 'jogada_confirmada': {
        if (ultimoEvento.dados.idDoJogador !== jogador.id) {
          setEstadoJogo('revelando_resultado')
        }
        break
      }
      case 'resultado_da_rodada': {
        const dados = ultimoEvento.dados as {
          numeroDaRodada: number
          somaDosNumeros: number
          paridadeResultante: 'par' | 'impar'
          vencedorId: string
          primeiroJogadorVenceu: boolean
          proximaRodada: number
          pontuacaoPrimeiro: number
          pontuacaoSegundo: number
        }
        setUltimoResultado({
          numero: 0,
          paridade: 'par',
          venceu: dados.vencedorId === jogador.id,
          numeroOponente: 0,
          paridadeOponente: 'impar',
        })
        setPontuacao({
          jogador: ehPrimeiro ? dados.pontuacaoPrimeiro : dados.pontuacaoSegundo,
          oponente: ehPrimeiro ? dados.pontuacaoSegundo : dados.pontuacaoPrimeiro,
        })
        setRodadaAtual(dados.proximaRodada)
        setEstadoJogo('aguardando_jogada')
        tokenRef.current = crypto.randomUUID()
        setNumeroSelecionado(null)
        setParidadeSelecionada(null)
        break
      }
      case 'fim_da_partida': {
        const dados = ultimoEvento.dados as DadosResultadoFinal
        setResultadoFinal(dados)
        setPontuacao({
          jogador: ehPrimeiro ? dados.pontuacaoPrimeiro : dados.pontuacaoSegundo,
          oponente: ehPrimeiro ? dados.pontuacaoSegundo : dados.pontuacaoPrimeiro,
        })
        setEstadoJogo('partida_finalizada')
        break
      }
    }
  }, [eventos, jogador.id, ehPrimeiro])

  // Gerar intervalo do Caos (exibido no cliente)
  useEffect(() => {
    if (ehCaos && estadoJogo === 'aguardando_jogada') {
      // Gerar um intervalo determinístico para exibição usando rodada atual
      const hashBase = `${idDaPartida}-${rodadaAtual}`
      let hash = 0
      for (let i = 0; i < hashBase.length; i++) {
        hash = ((hash << 5) - hash) + hashBase.charCodeAt(i)
        hash |= 0
      }
      const inicio = Math.abs(hash) % 6
      const fim = inicio + (Math.abs(hash >> 8) % 6) + 3
      setIntervaloAtual(`0 a ${Math.min(fim, 20)}`)
    }
  }, [ehCaos, estadoJogo, idDaPartida, rodadaAtual])

  const lidarEnviarJogada = useCallback(async () => {
    if (!numeroSelecionado) return
    // Modo invisível não requer paridade
    if (!ehInvisivel && !paridadeSelecionada) return

    setCarregando(true)
    setErro(null)
    setEstadoJogo('jogada_enviada')

    if (ehRelampago) {
      const resultado = await chamarApi<{ status: string; mensagem?: string }>(
        '/api/partidas/confirmar-jogada-relampago',
        {
          idDaPartida,
          numeroDaRodada: rodadaAtual,
          numeroEscolhido: numeroSelecionado,
          paridadeEscolhida: paridadeSelecionada ?? (Math.random() < 0.5 ? 'par' : 'impar'),
          tokenDeIdempotencia: tokenRef.current,
        }
      )

      setCarregando(false)

      if (resultado.status === 'erro') {
        setErro(resultado.mensagem ?? 'Erro ao confirmar jogada.')
        setEstadoJogo('aguardando_jogada')
        return
      }
    } else {
      const resultado = await chamarApi<{ status: string; mensagem?: string }>(
        '/api/partidas/confirmar-jogada',
        {
          idDaPartida,
          numeroDaRodada: rodadaAtual,
          numeroEscolhido: numeroSelecionado,
          paridadeEscolhida: paridadeSelecionada ?? 'par',
          tokenDeIdempotencia: tokenRef.current,
        }
      )

      setCarregando(false)

      if (resultado.status === 'erro') {
        setErro(resultado.mensagem ?? 'Erro ao confirmar jogada.')
        setEstadoJogo('aguardando_jogada')
        return
      }
    }
  }, [numeroSelecionado, paridadeSelecionada, idDaPartida, rodadaAtual, ehRelampago, ehInvisivel])

  const lidarTempoEsgotado = useCallback(() => {
    setErro('Tempo esgotado!')
  }, [])

  // Condições de validação para o botão "Confirmar Jogada"
  const podeJogar =
    estadoJogo === 'aguardando_jogada' &&
    numeroSelecionado !== null &&
    (ehInvisivel || paridadeSelecionada !== null) &&
    !carregando

  const ehMinhaVez = estadoJogo === 'aguardando_jogada'

  // Final da partida
  if (estadoJogo === 'partida_finalizada' && resultadoFinal) {
    return (
      <ResultadoFinalDaPartida
        venceu={resultadoFinal.vencedorId === jogador.id}
        eloGanho={resultadoFinal.eloGanho}
        eloPerdido={resultadoFinal.eloPerdido}
        novoElo={resultadoFinal.vencedorId === jogador.id
          ? resultadoFinal.novoEloVencedor
          : resultadoFinal.novoEloPerdedor}
        pontuacaoJogador={pontuacao.jogador}
        pontuacaoOponente={pontuacao.oponente}
        nomeOponente={oponente.nome}
        idDaPartida={idDaPartida}
        onJogarNovamente={() => router.push('/partida-rapida/fila')}
        onVerPerfil={() => router.push('/perfil')}
      />
    )
  }

  return (
    <div className={styles.container}>
      {/* Banner do modo de jogo */}
      <div className={styles.bannerModo}>
        <span className={styles.bannerTexto}>{nomearModo(modo)}</span>
      </div>

      {/* Banner do Caos: mostra o intervalo atual */}
      {ehCaos && intervaloAtual && ehMinhaVez && (
        <div className={styles.bannerCaos}>
          🎲 Intervalo desta rodada: {intervaloAtual}
        </div>
      )}

      <div className={styles.placarContainer}>
        <PlacarDaPartida
          jogadorA={ehPrimeiro ? jogador.nome : oponente.nome}
          pontuacaoA={ehPrimeiro ? pontuacao.jogador : pontuacao.oponente}
          jogadorB={ehPrimeiro ? oponente.nome : jogador.nome}
          pontuacaoB={ehPrimeiro ? pontuacao.oponente : pontuacao.jogador}
          rodadaAtual={rodadaAtual}
          totalRodadas={totalRodadas}
          jogadorAtivo={ehMinhaVez ? (ehPrimeiro ? 'A' : 'B') : undefined}
        />
      </div>

      {/* Timer: usa o CronometroDaRodada normal ou o timer relâmpago custom */}
      <div className={`${styles.timerContainer} ${ehRelampago ? styles.timerRelampago : ''}`}>
        {ehRelampago ? (
          <div className={styles.timerRelampagoInner}>
            <div
              className={`${styles.tempoRelampago} ${tempoRelampagoAlerta ? styles.tempoRelampagoAlerta : ''}`}
            >
              {tempoRelampagoRestante}
            </div>
            <div className={styles.barraRelampagoContainer}>
              <div
                className={`${styles.barraRelampago} ${tempoRelampagoAlerta ? styles.barraRelampagoAlerta : ''}`}
                style={{ width: `${(tempoRelampagoRestante / tempoLimite) * 100}%` }}
              />
            </div>
            <span className={styles.labelRelampago}>
              {tempoRelampagoAlerta ? '⚡ Últimos segundos!' : 'Tempo restante'}
            </span>
          </div>
        ) : (
          <CronometroDaRodada
            segundos={tempoLimite}
            emExecucao={estadoJogo === 'aguardando_jogada'}
            onTempoEsgotado={lidarTempoEsgotado}
          />
        )}
      </div>

      {!conectado && (
        <div className={styles.avisoConexao}>
          Conectando ao servidor...
        </div>
      )}

      {erro && (
        <div className={styles.erro}>
          {erro}
        </div>
      )}

      <div className={styles.areaDeJogo}>
        {estadoJogo === 'jogada_enviada' && (
          <div className={styles.aguardando}>
            <div className={styles.pontinhos}>
              <span className={styles.ponto} />
              <span className={styles.ponto} />
              <span className={styles.ponto} />
            </div>
            <p className={styles.textoAguardando}>
              Aguardando {oponente.nome} jogar...
            </p>
          </div>
        )}

        {estadoJogo === 'revelando_resultado' && (
          <div className={styles.aguardando}>
            <p className={styles.textoAguardando}>
              Revelando resultado...
            </p>
          </div>
        )}

        {ultimoResultado && (
          <div className={styles.revelacao}>
            <AnimacaoDeRevelacao
              numero={ultimoResultado.numero}
              paridade={ultimoResultado.paridade}
              venceu={ultimoResultado.venceu}
              ativo={estadoJogo !== 'partida_finalizada'}
            />
          </div>
        )}

        {ehMinhaVez && (
          <>
            <div className={styles.secao}>
              <h3 className={styles.label}>Escolha seu número</h3>
              <SeletorDeNumero
                valorSelecionado={numeroSelecionado}
                onChange={setNumeroSelecionado}
                desabilitado={!ehMinhaVez}
                maxNumeros={maxNumeros}
              />
            </div>

            {ehInvisivel ? (
              <div className={styles.secao}>
                <div className={styles.avisoInvisivel}>
                  <span className={styles.iconeInvisivel}>👻</span>
                  <p className={styles.textoInvisivel}>
                    Par/Ímpar será sorteado!<br />
                    <small>Escolha apenas o número. O sistema decide quem fica com Par ou Ímpar.</small>
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.secao}>
                <h3 className={styles.label}>Escolha Par ou Ímpar</h3>
                <SeletorDeParidade
                  valorSelecionado={paridadeSelecionada}
                  onChange={setParidadeSelecionada}
                  desabilitado={!ehMinhaVez}
                />
              </div>
            )}

            <div className={styles.acao}>
              <Botao
                onClick={lidarEnviarJogada}
                disabled={!podeJogar}
                carregando={carregando}
                tamanho="grande"
                larguraTotal
              >
                {ehRelampago ? '⚡ Confirmar Jogada' : 'Confirmar Jogada'}
              </Botao>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
