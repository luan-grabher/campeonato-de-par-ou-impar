'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, Trophy, Frown } from 'lucide-react'
import PlacarDaPartida from '@/componentes/ui/PlacarDaPartida'
import AnimacaoDeRevelacao from '@/componentes/ui/AnimacaoDeRevelacao'
import Botao from '@/componentes/ui/Botao'
import type { DadosDoReplay, RodadaDoReplay } from '@/core/tipos/replay'
import styles from './VisualizadorDeReplay.module.css'

interface VisualizadorDeReplayProps {
  dados: DadosDoReplay
  onVoltar?: () => void
}

function revelarNomeDoModo(modo: string): string {
  const mapa: Record<string, string> = {
    classico: 'Clássico',
    dificil: 'Difícil',
    relampago: '⚡ Relâmpago',
    invisivel: '👻 Invisível',
    caos: '🎲 Caos',
    sobrevivencia: 'Sobrevivência',
    partida_contra_ia: '🤖 vs IA',
  }
  return mapa[modo] ?? modo
}

export default function VisualizadorDeReplay({
  dados,
  onVoltar,
}: VisualizadorDeReplayProps) {
  const { partida, jogadores, rodadas, vencedorId } = dados

  const [rodadaAtual, setRodadaAtual] = useState(0)
  const [reproduzindo, setReproduzindo] = useState(false)
  const [revelado, setRevelado] = useState(false)
  const [finalizado, setFinalizado] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalRodadas = rodadas.length
  const rodadaVisivel = rodadas[rodadaAtual] ?? null
  const ehUltimaRodada = rodadaAtual >= totalRodadas - 1
  const estaReproduzindo = reproduzindo && !finalizado
  const atrasoPadraoMs = 2500

  // Calcular pontuação acumulada até a rodada atual
  const pontuacao = (function calcularPontuacao() {
    let ptsPrimeiro = 0
    let ptsSegundo = 0
    for (let i = 0; i <= rodadaAtual; i++) {
      const r = rodadas[i]
      if (!r) continue
      if (r.resultado.vencedorId === jogadores[0].id) {
        ptsPrimeiro++
      } else if (r.resultado.vencedorId === jogadores[1].id) {
        ptsSegundo++
      }
    }
    return { ptsPrimeiro, ptsSegundo }
  })()

  // Limpar timers
  const limparTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current)
      intervaloRef.current = null
    }
  }, [])

  // Avançar para a próxima rodada
  const avancar = useCallback(() => {
    if (ehUltimaRodada) {
      setReproduzindo(false)
      setFinalizado(true)
      return
    }
    setRodadaAtual((prev) => prev + 1)
    setRevelado(false)
  }, [ehUltimaRodada])

  // Revelar o resultado da rodada atual
  const revelar = useCallback(() => {
    setRevelado(true)
  }, [])

  // Voltar para a rodada anterior
  const retroceder = useCallback(() => {
    if (rodadaAtual <= 0) return
    setRodadaAtual((prev) => prev - 1)
    setRevelado(false)
    setFinalizado(false)
  }, [rodadaAtual])

  // Ir para uma rodada específica
  const irParaRodada = useCallback(
    (indice: number) => {
      if (indice < 0 || indice >= totalRodadas) return
      limparTimers()
      setRodadaAtual(indice)
      setRevelado(false)
      setFinalizado(false)
      setReproduzindo(false)
    },
    [totalRodadas, limparTimers]
  )

  // Toggle play/pause
  const toggleReproducao = useCallback(() => {
    if (finalizado) {
      // Reiniciar
      setRodadaAtual(0)
      setRevelado(false)
      setFinalizado(false)
      setReproduzindo(true)
      return
    }
    setReproduzindo((prev) => !prev)
  }, [finalizado])

  // Auto-reprodução: espera, revela, espera, avança
  useEffect(() => {
    if (!estaReproduzindo) return

    if (!revelado) {
      timerRef.current = setTimeout(() => {
        revelar()
      }, 800)
    } else {
      timerRef.current = setTimeout(() => {
        avancar()
      }, atrasoPadraoMs)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [estaReproduzindo, revelado, avancar, revelar])

  // Limpar timers ao desmontar
  useEffect(() => {
    return () => limparTimers()
  }, [limparTimers])

  // Estatísticas finais
  const venceuPrimeiro = vencedorId === jogadores[0].id
  const totalVitoriasPrimeiro = rodadas.filter(
    (r) => r.resultado.vencedorId === jogadores[0].id
  ).length
  const totalVitoriasSegundo = rodadas.filter(
    (r) => r.resultado.vencedorId === jogadores[1].id
  ).length

  // Nomes
  const nomePrimeiro = jogadores[0]?.nome ?? 'Jogador 1'
  const nomeSegundo = jogadores[1]?.nome ?? 'Jogador 2'
  const nomeVencedor = jogadores.find((j) => j.id === vencedorId)?.nome ?? '?'

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.cabecalho}>
        {onVoltar && (
          <button
            type="button"
            className={styles.botaoVoltar}
            onClick={onVoltar}
            aria-label="Voltar"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div className={styles.infoCabecalho}>
          <h1 className={styles.titulo}>🎬 Replay da Partida</h1>
          <span className={styles.modoTag}>
            {revelarNomeDoModo(partida.modo)}
          </span>
        </div>
      </div>

      {/* Placar */}
      <PlacarDaPartida
        jogadorA={nomePrimeiro}
        pontuacaoA={pontuacao.ptsPrimeiro}
        jogadorB={nomeSegundo}
        pontuacaoB={pontuacao.ptsSegundo}
        rodadaAtual={finalizado ? totalRodadas : rodadaAtual + 1}
        totalRodadas={totalRodadas}
        className={styles.placar}
      />

      {/* Conteúdo principal */}
      <div className={styles.areaDeJogo}>
        {finalizado ? (
          <div className={styles.telaFinal}>
            <div className={styles.iconeFinal}>
              {venceuPrimeiro ? (
                <Trophy size={56} className={styles.iconeVitoria} />
              ) : (
                <Frown size={56} className={styles.iconeDerrota} />
              )}
            </div>
            <h2 className={styles.tituloFinal}>
              {venceuPrimeiro ? nomePrimeiro : nomeSegundo} venceu!
            </h2>
            <p className={styles.subtituloFinal}>
              {nomePrimeiro} {pontuacao.ptsPrimeiro} × {pontuacao.ptsSegundo}{' '}
              {nomeSegundo}
            </p>

            <div className={styles.estatisticas}>
              <h3 className={styles.tituloEstatisticas}>
                📊 Estatísticas da Partida
              </h3>
              <div className={styles.gradeEstatisticas}>
                <div className={styles.cartaoEstatistica}>
                  <span className={styles.estatisticaValor}>{totalRodadas}</span>
                  <span className={styles.estatisticaLabel}>Rodadas</span>
                </div>
                <div className={styles.cartaoEstatistica}>
                  <span className={styles.estatisticaValor}>
                    {totalVitoriasPrimeiro}
                  </span>
                  <span className={styles.estatisticaLabel}>
                    {nomePrimeiro}
                  </span>
                </div>
                <div className={styles.cartaoEstatistica}>
                  <span className={styles.estatisticaValor}>
                    {totalVitoriasSegundo}
                  </span>
                  <span className={styles.estatisticaLabel}>
                    {nomeSegundo}
                  </span>
                </div>
                <div className={styles.cartaoEstatistica}>
                  <span className={styles.estatisticaValor}>
                    {partida.modo}
                  </span>
                  <span className={styles.estatisticaLabel}>Modo</span>
                </div>
              </div>
            </div>

            <Botao
              variante="primario"
              tamanho="medio"
              onClick={() => {
                setRodadaAtual(0)
                setRevelado(false)
                setFinalizado(false)
                setReproduzindo(false)
              }}
            >
              Ver Novamente
            </Botao>
          </div>
        ) : rodadaVisivel ? (
          <div className={styles.rodadaAtual}>
            {/* Jogadas lado a lado */}
            <div className={styles.jogadasContainer}>
              <div className={styles.jogadaCard}>
                <div className={styles.jogadaCardCabecalho}>
                  <span className={styles.jogadaRotulo}>Jogador 1</span>
                  <strong className={styles.jogadaNome}>
                    {nomePrimeiro}
                  </strong>
                </div>
                {revelado ? (
                  <div className={styles.jogadaRevelada}>
                    <span className={styles.numeroGrande}>
                      {rodadaVisivel.jogadaPrimeiro.numero}
                    </span>
                    <span
                      className={`${styles.paridadeTag} ${
                        rodadaVisivel.jogadaPrimeiro.paridade === 'par'
                          ? styles.par
                          : styles.impar
                      }`}
                    >
                      {rodadaVisivel.jogadaPrimeiro.paridade === 'par'
                        ? 'PAR'
                        : 'ÍMPAR'}
                    </span>
                  </div>
                ) : (
                  <div className={styles.jogadaOculta}>
                    <span className={styles.interrogacao}>?</span>
                    <span className={styles.jogadaOcultaLabel}>
                      Aguardando...
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.vsContainer}>
                <span className={styles.vsTexto}>VS</span>
                <span className={styles.rodadaIndice}>
                  Rodada {rodadaVisivel.numero}
                </span>
              </div>

              <div className={styles.jogadaCard}>
                <div className={styles.jogadaCardCabecalho}>
                  <span className={styles.jogadaRotulo}>Jogador 2</span>
                  <strong className={styles.jogadaNome}>
                    {nomeSegundo}
                  </strong>
                </div>
                {revelado ? (
                  <div className={styles.jogadaRevelada}>
                    <span className={styles.numeroGrande}>
                      {rodadaVisivel.jogadaSegundo.numero}
                    </span>
                    <span
                      className={`${styles.paridadeTag} ${
                        rodadaVisivel.jogadaSegundo.paridade === 'par'
                          ? styles.par
                          : styles.impar
                      }`}
                    >
                      {rodadaVisivel.jogadaSegundo.paridade === 'par'
                        ? 'PAR'
                        : 'ÍMPAR'}
                    </span>
                  </div>
                ) : (
                  <div className={styles.jogadaOculta}>
                    <span className={styles.interrogacao}>?</span>
                    <span className={styles.jogadaOcultaLabel}>
                      Aguardando...
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Resultado */}
            {revelado && (
              <div className={styles.resultadoRodada}>
                <AnimacaoDeRevelacao
                  numero={rodadaVisivel.resultado.soma}
                  paridade={rodadaVisivel.resultado.paridadeResultante}
                  venceu={rodadaVisivel.resultado.vencedorId === jogadores[0]?.id}
                  ativo
                />
                <div className={styles.quemVenceu}>
                  {rodadaVisivel.resultado.vencedorId === jogadores[0]?.id
                    ? `${nomePrimeiro} venceu a rodada!`
                    : `${nomeSegundo} venceu a rodada!`}
                </div>
              </div>
            )}

            {/* Barra de progresso */}
            <div className={styles.barraProgresso}>
              {rodadas.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`${styles.marcadorProgresso} ${
                    idx === rodadaAtual ? styles.marcadorAtivo : ''
                  } ${idx < rodadaAtual ? styles.marcadorCompleto : ''}`}
                  onClick={() => irParaRodada(idx)}
                  aria-label={`Ir para rodada ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.semRodadas}>
            <p>Nenhuma rodada encontrada neste replay.</p>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className={styles.controles}>
        <Botao
          variante="ghost"
          tamanho="pequeno"
          onClick={retroceder}
          disabled={rodadaAtual <= 0 || finalizado}
          aria-label="Rodada anterior"
        >
          <SkipBack size={18} />
        </Botao>

        <Botao
          variante="primario"
          tamanho="medio"
          onClick={toggleReproducao}
          aria-label={estaReproduzindo ? 'Pausar' : 'Reproduzir'}
        >
          {estaReproduzindo ? (
            <>
              <Pause size={18} /> Pausar
            </>
          ) : finalizado ? (
            <>
              <Play size={18} /> Repetir
            </>
          ) : (
            <>
              <Play size={18} /> Reproduzir
            </>
          )}
        </Botao>

        <Botao
          variante="ghost"
          tamanho="pequeno"
          onClick={avancar}
          disabled={finalizado}
          aria-label="Próxima rodada"
        >
          <SkipForward size={18} />
        </Botao>
      </div>

      {/* Legenda dos jogadores */}
      <div className={styles.legenda}>
        <div className={styles.legendaJogador}>
          <div
            className={styles.legendaCor}
            style={{ background: 'var(--corDestaquePrimario)' }}
          />
          <span className={styles.legendaNome}>{nomePrimeiro}</span>
          <span className={styles.legendaElo}>Elo: {jogadores[0]?.elo}</span>
        </div>
        <div className={styles.legendaJogador}>
          <div
            className={styles.legendaCor}
            style={{ background: 'var(--corDestaqueSecundario)' }}
          />
          <span className={styles.legendaNome}>{nomeSegundo}</span>
          <span className={styles.legendaElo}>Elo: {jogadores[1]?.elo}</span>
        </div>
      </div>
    </div>
  )
}
