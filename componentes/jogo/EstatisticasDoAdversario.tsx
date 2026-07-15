'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  buscarEstatisticasDoAdversario,
  type EstatisticasDoAdversario,
} from '@/servidor/acoes/buscarEstatisticasDoAdversario'
import styles from './EstatisticasDoAdversario.module.css'

interface EstatisticasDoAdversarioProps {
  idDoOponente: string
  idDaPartida: string
}

export default function EstatisticasDoAdversario({
  idDoOponente,
  idDaPartida,
}: EstatisticasDoAdversarioProps) {
  const [dados, setDados] = useState<EstatisticasDoAdversario | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregarEstatisticas = useCallback(async () => {
    try {
      const resultado = await buscarEstatisticasDoAdversario({
        idDaPartida,
        idDoOponente,
      })

      if ('erro' in resultado) {
        setErro(resultado.erro)
        return
      }

      setDados(resultado)
      setErro(null)
    } catch {
      setErro('Erro ao carregar estatísticas.')
    } finally {
      setCarregando(false)
    }
  }, [idDaPartida, idDoOponente])

  useEffect(() => {
    carregarEstatisticas()

    // Atualizar a cada 3 segundos para capturar novas rodadas
    const intervalo = setInterval(carregarEstatisticas, 3000)

    return () => clearInterval(intervalo)
  }, [carregarEstatisticas])

  if (carregando && !dados) {
    return (
      <div className={styles.container}>
        <h3 className={styles.titulo}>📊 Estatísticas do Adversário</h3>
        <div className={styles.carregando}>Carregando estatísticas...</div>
      </div>
    )
  }

  if (erro && !dados) {
    return null
  }

  if (!dados) {
    return null
  }

  const numeros = Array.from({ length: 11 }, (_, i) => i)
  const maxFrequencia = Math.max(
    ...numeros.map((n) => dados.frequenciaDosNumeros[n] ?? 0),
    1
  )
  const temDadosNoGrafico = Object.keys(dados.frequenciaDosNumeros).length > 0
  const totalDeJogadas = Object.values(dados.frequenciaDosNumeros).reduce(
    (acc, v) => acc + v,
    0
  )

  return (
    <div className={styles.container}>
      <h3 className={styles.titulo}>📊 Estatísticas do Adversário</h3>

      {/* Gráfico de barras — frequência dos números */}
      <div className={styles.secao}>
        <h4 className={styles.subtitulo}>Frequência dos Números</h4>
        {temDadosNoGrafico ? (
          <div className={styles.grafico}>
            {numeros.map((numero) => {
              const frequencia = dados.frequenciaDosNumeros[numero] ?? 0
              const altura = (frequencia / maxFrequencia) * 100
              const temBarra = frequencia > 0

              return (
                <div key={numero} className={styles.coluna}>
                  <div className={styles.barraWrapper}>
                    {temBarra && (
                      <span className={styles.rotuloFrequencia}>
                        {frequencia}
                      </span>
                    )}
                    <div
                      className={styles.barra}
                      style={{
                        height: `${Math.max(altura, temBarra ? 4 : 0)}%`,
                      }}
                      role="img"
                      aria-label={`Número ${numero}: ${frequencia} vez(es)`}
                    />
                  </div>
                  <span className={styles.rotuloNumero}>{numero}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={styles.vazio}>
            Nenhuma jogada registrada ainda.
          </div>
        )}
      </div>

      {/* Número mais utilizado */}
      {dados.numeroMaisUsado !== null && (
        <div className={styles.secao}>
          <h4 className={styles.subtitulo}>Número Favorito</h4>
          <div className={styles.numeroDestacado}>
            <span className={styles.iconeDestaque}>🎯</span>
            <div className={styles.infoDestaque}>
              <span className={styles.rotuloDestaque}>Mais utilizado</span>
              <span className={styles.valorDestaque}>
                {dados.numeroMaisUsado}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Frequência Par/Ímpar */}
      {totalDeJogadas > 0 && (
        <div className={styles.secao}>
          <h4 className={styles.subtitulo}>Par vs Ímpar</h4>
          <div className={styles.barraDupla}>
            <div className={styles.barraDuplaItem}>
              <span className={styles.barraDuplaRotulo}>Par</span>
              <div
                className={`${styles.barraDuplaBarra} ${styles.barraDuplaPar}`}
                style={{ width: `${dados.frequenciaDePares * 100}%` }}
              />
              <span className={styles.barraDuplaValor}>
                {(dados.frequenciaDePares * 100).toFixed(0)}%
              </span>
            </div>
            <div className={styles.barraDuplaItem}>
              <span className={styles.barraDuplaRotulo}>Ímpar</span>
              <div
                className={`${styles.barraDuplaBarra} ${styles.barraDuplaImpar}`}
                style={{ width: `${dados.frequenciaDeImpares * 100}%` }}
              />
              <span className={styles.barraDuplaValor}>
                {(dados.frequenciaDeImpares * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sequência atual */}
      {dados.sequenciaAtual.length > 0 && (
        <div className={styles.secao}>
          <h4 className={styles.subtitulo}>Sequência Atual</h4>
          <div className={styles.sequencia}>
            {dados.sequenciaAtual.map((numero, indice) => (
              <div
                key={`${indice}-${numero}`}
                className={`${styles.bolinha} ${
                  numero % 2 === 0 ? styles.bolinhaPar : styles.bolinhaImpar
                }`}
                title={`Número ${numero} (${numero % 2 === 0 ? 'par' : 'ímpar'})`}
              >
                {numero}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Taxa de repetição */}
      {totalDeJogadas > 1 && (
        <div className={styles.secao}>
          <h4 className={styles.subtitulo}>Taxa de Repetição</h4>
          <div className={styles.barraRepeticao}>
            <div className={styles.barraRepeticaoBarra}>
              <div
                className={styles.barraRepeticaoPreenchimento}
                style={{ width: `${dados.taxaDeRepeticao * 100}%` }}
              />
            </div>
            <span className={styles.barraRepeticaoValor}>
              {(dados.taxaDeRepeticao * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
