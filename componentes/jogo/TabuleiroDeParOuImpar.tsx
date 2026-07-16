'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import IndicadorDeParidade from '@/componentes/ui/IndicadorDeParidade'
import SeletorDeParidade from '@/componentes/ui/SeletorDeParidade'
import PlacarDaPartida from '@/componentes/ui/PlacarDaPartida'
import AnimacaoDeRevelacao from '@/componentes/ui/AnimacaoDeRevelacao'
import EfeitoDeVitoria from '@/componentes/ui/EfeitoDeVitoria'
import Botao from '@/componentes/ui/Botao'
import HistoricoDeRodadas from './HistoricoDeRodadas'
import { chamarApi } from '@/hooks/usarApiCliente'
import CronometroDaRodada from '@/componentes/ui/CronometroDaRodada'
import styles from './TabuleiroDeParOuImpar.module.css'

type EstadoDoJogo =
  | 'ESCOLHENDO'
  | 'AGUARDANDO_RESULTADO'
  | 'EXIBINDO_RESULTADO'
  | 'FIM_DA_PARTIDA'

interface ResultadoDaRodadaConfirmada {
  numeroDaRodada: number
  numeroDoJogador: number
  paridadeDoJogador: 'par' | 'impar'
  numeroDaIa: number
  paridadeDaIa: 'par' | 'impar'
  resultado: {
    somaDosNumeros: number
    paridadeResultante: 'par' | 'impar'
    primeiroJogadorVenceu: boolean
  }
  pontuacaoDoJogador: number
  pontuacaoDaIa: number
  partidaFinalizada: boolean
  vencedor: 'jogador' | 'ia' | null
}

interface IniciarPartidaResultado {
  idDaPartida: string
  totalDeRodadas: number
}

interface RodadaHistorico {
  numeroDaRodada: number
  numeroDoJogador: number
  paridadeDoJogador: 'par' | 'impar'
  numeroDaIa: number
  paridadeDaIa: 'par' | 'impar'
  jogadorVenceu: boolean
}

interface TabuleiroDeParOuImparProps {
  idDaPartida: string
  nomeDoJogador: string
  totalDeRodadas: number
  minimo?: number
  maximo?: number
}

const INTERVALO_ANIMACAO_MS = 2500

export default function TabuleiroDeParOuImpar({
  idDaPartida,
  nomeDoJogador,
  totalDeRodadas,
  minimo = 0,
  maximo = 10,
}: TabuleiroDeParOuImparProps) {
  const router = useRouter()

  const [estado, setEstado] = useState<EstadoDoJogo>('ESCOLHENDO')
  const [numeroSelecionado, setNumeroSelecionado] = useState<number | null>(
    null
  )
  const [erro, setErro] = useState<string | null>(null)

  // Estado da partida
  const [rodadaAtual, setRodadaAtual] = useState(1)
  const [pontuacaoDoJogador, setPontuacaoDoJogador] = useState(0)
  const [pontuacaoDaIa, setPontuacaoDaIa] = useState(0)
  const [vencedor, setVencedor] = useState<'jogador' | 'ia' | null>(null)
  const [partidaFinalizada, setPartidaFinalizada] = useState(false)
  const [historico, setHistorico] = useState<RodadaHistorico[]>([])

  // Último resultado para animação
  const [ultimoResultado, setUltimoResultado] =
    useState<ResultadoDaRodadaConfirmada | null>(null)

  const tokenRef = useRef<string>(crypto.randomUUID())

  // Estado de desempate
  const [ehDesempate, setEhDesempate] = useState(false)
  const [jogadorVenceuPrimeiraRodada, setJogadorVenceuPrimeiraRodada] =
    useState(false)
  const [paridadeEscolhidaDesempate, setParidadeEscolhidaDesempate] = useState<
    'par' | 'impar' | null
  >(null)

  // Paridade automática — alterna a cada rodada
  const paridadeDoJogador: 'par' | 'impar' =
    rodadaAtual % 2 === 1 ? 'par' : 'impar'

  const podeConfirmar = ehDesempate
    ? jogadorVenceuPrimeiraRodada
      ? numeroSelecionado !== null && paridadeEscolhidaDesempate !== null
      : false
    : numeroSelecionado !== null

  // Callback para quando o timer esgotar — ENVIA a jogada (timeout = derrota automática)
  const lidarEnviarJogadaComTimeout = useCallback(async () => {
    if (estado !== 'ESCOLHENDO') return

    // Timeout = derrota. O número enviado é irrelevante (servidor ignora).
    // Só precisa ser um número válido pra passar na validação mínima da rota.
    const numeroParaEnvio = numeroSelecionado ?? 0

    setErro(null)
    setEstado('AGUARDANDO_RESULTADO')

    try {
      const resposta = await chamarApi(
        '/api/partidas/confirmar-jogada',
        {
          idDaPartida,
          numeroDaRodada: rodadaAtual,
          numeroEscolhido: numeroParaEnvio,
          tokenDeIdempotencia: tokenRef.current,
          timeoutNoCliente: true,
        }
      )
      tokenRef.current = crypto.randomUUID()

      if (resposta.status === 'erro') {
        throw new Error(resposta.mensagem ?? 'Erro ao confirmar jogada.')
      }

      if (resposta.status === 'jogada_registrada') {
        setEstado('ESCOLHENDO')
        return
      }

      // === Extrair dados do resultado ===
      const { dados } = resposta
      const primeiroJogadorVenceu = dados.primeiroJogadorVenceu
      const numeroDaIa = dados.somaDosNumeros - numeroParaEnvio
      const paridadeDoJogadorAtual: 'par' | 'impar' =
        rodadaAtual % 2 === 1 ? 'par' : 'impar'

      const resultadoFormatado: ResultadoDaRodadaConfirmada = {
        numeroDaRodada: dados.numeroDaRodada,
        numeroDoJogador: numeroParaEnvio,
        paridadeDoJogador: paridadeDoJogadorAtual,
        numeroDaIa,
        paridadeDaIa: paridadeDoJogadorAtual === 'par' ? 'impar' : 'par',
        resultado: {
          somaDosNumeros: dados.somaDosNumeros,
          paridadeResultante: dados.paridadeResultante,
          primeiroJogadorVenceu,
        },
        pontuacaoDoJogador: resposta.status === 'partida_finalizada'
          ? (resposta.resultado?.pontuacaoPrimeiro ?? 0)
          : pontuacaoDoJogador + (primeiroJogadorVenceu ? 1 : 0),
        pontuacaoDaIa: resposta.status === 'partida_finalizada'
          ? (resposta.resultado?.pontuacaoSegundo ?? 0)
          : pontuacaoDaIa + (primeiroJogadorVenceu ? 0 : 1),
        partidaFinalizada: resposta.partidaFinalizada ?? false,
        vencedor: resposta.status === 'partida_finalizada'
          ? (primeiroJogadorVenceu ? 'jogador' : 'ia')
          : null,
      }

      setUltimoResultado(resultadoFormatado)
      setPontuacaoDoJogador(resultadoFormatado.pontuacaoDoJogador)
      setPontuacaoDaIa(resultadoFormatado.pontuacaoDaIa)

      setHistorico((prev) => [
        ...prev,
        {
          numeroDaRodada: dados.numeroDaRodada,
          numeroDoJogador: numeroParaEnvio,
          paridadeDoJogador: paridadeDoJogadorAtual,
          numeroDaIa,
          paridadeDaIa: paridadeDoJogadorAtual === 'par' ? 'impar' : 'par',
          jogadorVenceu: primeiroJogadorVenceu,
        },
      ])

      setEstado('EXIBINDO_RESULTADO')

      setTimeout(() => {
        if (resultadoFormatado.partidaFinalizada) {
          setVencedor(resultadoFormatado.vencedor)
          setPartidaFinalizada(true)
          setEstado('FIM_DA_PARTIDA')
        } else {
          setRodadaAtual(resultadoFormatado.numeroDaRodada + 1)
          setNumeroSelecionado(null)
          setEstado('ESCOLHENDO')
        }
      }, INTERVALO_ANIMACAO_MS)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao confirmar jogada.'
      setErro(mensagem)
      setEstado('ESCOLHENDO')
    }
  }, [
    estado,
    idDaPartida,
    rodadaAtual,
    numeroSelecionado,
    pontuacaoDoJogador,
    pontuacaoDaIa,
  ])

  const handleConfirmar = useCallback(async () => {
    if (!podeConfirmar || estado !== 'ESCOLHENDO') return

    setErro(null)
    setEstado('AGUARDANDO_RESULTADO')

    try {
      // Se for desempate e jogador venceu R1, definir paridade do desempate primeiro
      if (
        ehDesempate &&
        jogadorVenceuPrimeiraRodada &&
        paridadeEscolhidaDesempate
      ) {
        await chamarApi(
          '/api/partida-contra-ia/definir-paridade-desempate',
          {
            idDaPartida,
            paridadeEscolhida: paridadeEscolhidaDesempate,
          }
        )
      }

      const resposta = await chamarApi(
        '/api/partidas/confirmar-jogada',
        {
          idDaPartida,
          numeroDaRodada: rodadaAtual,
          numeroEscolhido: numeroSelecionado!,
          tokenDeIdempotencia: tokenRef.current,
        }
      )
      tokenRef.current = crypto.randomUUID()

      if (resposta.status === 'erro') {
        throw new Error(resposta.mensagem ?? 'Erro ao confirmar jogada.')
      }

      if (resposta.status === 'jogada_registrada') {
        // No modo IA, isso não deveria acontecer, mas se acontecer, esperar
        setEstado('ESCOLHENDO')
        return
      }

      // Extrair dados do novo formato { status, dados, ... }
      const { dados } = resposta
      const primeiroJogadorVenceu = dados.primeiroJogadorVenceu
      const numeroDaIa = dados.somaDosNumeros - numeroSelecionado!
      const paridadeDoJogadorAtual: 'par' | 'impar' =
        rodadaAtual % 2 === 1 ? 'par' : 'impar'

      const resultadoFormatado: ResultadoDaRodadaConfirmada = {
        numeroDaRodada: dados.numeroDaRodada,
        numeroDoJogador: numeroSelecionado!,
        paridadeDoJogador: paridadeDoJogadorAtual,
        numeroDaIa,
        paridadeDaIa: paridadeDoJogadorAtual === 'par' ? 'impar' : 'par',
        resultado: {
          somaDosNumeros: dados.somaDosNumeros,
          paridadeResultante: dados.paridadeResultante,
          primeiroJogadorVenceu,
        },
        pontuacaoDoJogador: resposta.status === 'partida_finalizada'
          ? (resposta.resultado?.pontuacaoPrimeiro ?? 0)
          : pontuacaoDoJogador + (primeiroJogadorVenceu ? 1 : 0),
        pontuacaoDaIa: resposta.status === 'partida_finalizada'
          ? (resposta.resultado?.pontuacaoSegundo ?? 0)
          : pontuacaoDaIa + (primeiroJogadorVenceu ? 0 : 1),
        partidaFinalizada: resposta.partidaFinalizada ?? false,
        vencedor: resposta.status === 'partida_finalizada'
          ? (primeiroJogadorVenceu ? 'jogador' : 'ia')
          : null,
      }

      setUltimoResultado(resultadoFormatado)
      setPontuacaoDoJogador(resultadoFormatado.pontuacaoDoJogador)
      setPontuacaoDaIa(resultadoFormatado.pontuacaoDaIa)

      setHistorico((prev) => [
        ...prev,
        {
          numeroDaRodada: dados.numeroDaRodada,
          numeroDoJogador: numeroSelecionado!,
          paridadeDoJogador: paridadeDoJogadorAtual,
          numeroDaIa,
          paridadeDaIa: paridadeDoJogadorAtual === 'par' ? 'impar' : 'par',
          jogadorVenceu: primeiroJogadorVenceu,
        },
      ])

      setEstado('EXIBINDO_RESULTADO')

      // Após a animação, avança ou finaliza
      setTimeout(() => {
        if (resultadoFormatado.partidaFinalizada) {
          setVencedor(resultadoFormatado.vencedor)
          setPartidaFinalizada(true)
          setEstado('FIM_DA_PARTIDA')
        } else {
          setRodadaAtual(resultadoFormatado.numeroDaRodada + 1)
          setNumeroSelecionado(null)
          setEstado('ESCOLHENDO')
        }
      }, INTERVALO_ANIMACAO_MS)
    } catch (err) {
      const mensagem =
        err instanceof Error ? err.message : 'Erro ao confirmar jogada.'
      setErro(mensagem)
      setEstado('ESCOLHENDO')
    }
  }, [
    podeConfirmar,
    estado,
    idDaPartida,
    rodadaAtual,
    numeroSelecionado,
    pontuacaoDoJogador,
    pontuacaoDaIa,
    ehDesempate,
    jogadorVenceuPrimeiraRodada,
    paridadeEscolhidaDesempate,
  ])

  async function handleJogarNovamente() {
    try {
      const novaPartida = await chamarApi<IniciarPartidaResultado>(
        '/api/partida-contra-ia/iniciar',
        {}
      )

      router.push(
        `/partida-rapida-ia/jogo?id=${novaPartida.idDaPartida}`
      )
    } catch {
      router.push('/partida-rapida-ia')
    }
  }

  const numeros = Array.from(
    { length: maximo - minimo + 1 },
    (_, i) => minimo + i
  )

  return (
    <div className={styles.container}>
      {/* Placar */}
      <PlacarDaPartida
        jogadorA={nomeDoJogador}
        pontuacaoA={pontuacaoDoJogador}
        jogadorB="🤖 IA"
        pontuacaoB={pontuacaoDaIa}
        rodadaAtual={rodadaAtual}
        totalRodadas={totalDeRodadas}
      />

      {/* Timer da rodada */}
      <div className={styles.timerContainer}>
        <CronometroDaRodada
          segundos={20}
          emExecucao={estado === 'ESCOLHENDO'}
          onTempoEsgotado={() => {
            if (estado === 'ESCOLHENDO') {
              lidarEnviarJogadaComTimeout()
            }
          }}
        />
      </div>

      {/* Área de jogo */}
      <div className={styles.areaDeJogo}>
        {estado === 'ESCOLHENDO' && (
          <>
            <div className={styles.secao}>
              <h3 className={styles.tituloSecao}>Escolha seu número</h3>
              <div
                className={styles.gridNumeros}
                style={{
                  gridTemplateColumns: `repeat(${Math.min(numeros.length, 5)}, 1fr)`,
                }}
              >
                {numeros.map((numero) => {
                  const selecionado = numeroSelecionado === numero
                  return (
                    <button
                      key={numero}
                      className={`${styles.botaoNumero} ${
                        selecionado ? styles.numeroSelecionado : ''
                      }`}
                      onClick={() => setNumeroSelecionado(numero)}
                      aria-pressed={selecionado}
                      aria-label={`Número ${numero}`}
                    >
                      {numero}
                    </button>
                  )
                })}
              </div>
            </div>

            {!ehDesempate ? (
              <div className={styles.secao}>
                <h3 className={styles.tituloSecao}>
                  Sua paridade nesta rodada
                </h3>
                <IndicadorDeParidade
                  paridade={paridadeDoJogador}
                  tamanho="grande"
                />
              </div>
            ) : jogadorVenceuPrimeiraRodada ? (
              <div className={styles.secao}>
                <p className={styles.dicaDesempate}>
                  Você venceu a primeira rodada! Escolha sua paridade para o
                  desempate:
                </p>
                <SeletorDeParidade
                  valorSelecionado={paridadeEscolhidaDesempate}
                  onChange={setParidadeEscolhidaDesempate}
                />
              </div>
            ) : (
              <div className={styles.secao}>
                <p className={styles.dicaDesempate}>
                  Aguardando IA escolher a paridade do desempate...
                </p>
              </div>
            )}

            {erro && (
              <div className={styles.erro} role="alert">
                {erro}
              </div>
            )}

            <Botao
              variante="primario"
              tamanho="grande"
              larguraTotal
              disabled={!podeConfirmar}
              onClick={handleConfirmar}
            >
              Confirmar Jogada
            </Botao>
          </>
        )}

        {estado === 'AGUARDANDO_RESULTADO' && (
          <div className={styles.aguardando}>
            <div className={styles.spinner} aria-hidden="true" />
            <p className={styles.textoAguardando}>IA está jogando...</p>
          </div>
        )}

        {estado === 'EXIBINDO_RESULTADO' && ultimoResultado && (
          <div className={styles.revelacao}>
            <div className={styles.secaoResultado}>
              <h3 className={styles.tituloSecao}>Sua jogada</h3>
              <p className={styles.jogadaInfo}>
                <strong>{ultimoResultado.numeroDoJogador}</strong>{' '}
                <span
                  className={
                    ultimoResultado.paridadeDoJogador === 'par'
                      ? styles.par
                      : styles.impar
                  }
                >
                  ({ultimoResultado.paridadeDoJogador === 'par'
                    ? 'PAR'
                    : 'ÍMPAR'}
                  )
                </span>
              </p>
            </div>

            <div className={styles.secaoResultado}>
              <h3 className={styles.tituloSecao}>Jogada da IA</h3>
              <p className={styles.jogadaInfo}>
                <strong>{ultimoResultado.numeroDaIa}</strong>{' '}
                <span
                  className={
                    ultimoResultado.paridadeDaIa === 'par'
                      ? styles.par
                      : styles.impar
                  }
                >
                  ({ultimoResultado.paridadeDaIa === 'par'
                    ? 'PAR'
                    : 'ÍMPAR'}
                  )
                </span>
              </p>
            </div>

            <AnimacaoDeRevelacao
              numero={ultimoResultado.resultado.somaDosNumeros}
              paridade={ultimoResultado.resultado.paridadeResultante}
              venceu={ultimoResultado.resultado.primeiroJogadorVenceu}
              ativo
            />

            {ultimoResultado.partidaFinalizada && (
              <EfeitoDeVitoria
                venceu={ultimoResultado.vencedor === 'jogador'}
                ativo
              />
            )}
          </div>
        )}

        {estado === 'FIM_DA_PARTIDA' && (
          <div className={styles.fimPartida}>
            <h2 className={styles.tituloFim}>Fim de Partida!</h2>

            {vencedor === 'jogador' && (
              <p className={styles.resultadoFimVitoria}>
                🎉 Você venceu a partida!
              </p>
            )}
            {vencedor === 'ia' && (
              <p className={styles.resultadoFimDerrota}>
                🤖 A IA venceu. Tente novamente!
              </p>
            )}
            {vencedor === null && (
              <p className={styles.resultadoFimEmpate}>🤝 Empate técnico!</p>
            )}

            <div className={styles.placarFinal}>
              <span className={styles.placarItem}>
                {nomeDoJogador}: <strong>{pontuacaoDoJogador}</strong>
              </span>
              <span className={styles.placarDivisor}>x</span>
              <span className={styles.placarItem}>
                IA: <strong>{pontuacaoDaIa}</strong>
              </span>
            </div>

            <Botao
              variante="primario"
              tamanho="grande"
              onClick={handleJogarNovamente}
            >
              Jogar Novamente
            </Botao>
          </div>
        )}
      </div>

      {/* Histórico */}
      {historico.length > 0 && estado !== 'FIM_DA_PARTIDA' && (
        <HistoricoDeRodadas
          rodadas={historico}
          className={styles.historico}
        />
      )}
    </div>
  )
}
