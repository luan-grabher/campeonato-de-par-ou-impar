'use client'

import { useState } from 'react'
import type { PersonalidadeDaIa } from '@/servidor/integracoes/ia/executarJogadaDaIa'
import styles from './SeletorDeIa.module.css'

interface PersonalidadeInfo {
  id: PersonalidadeDaIa
  icone: string
  nome: string
  descricao: string
  cor: string
}

const PERSONALIDADES: PersonalidadeInfo[] = [
  {
    id: 'aleatoria',
    icone: '🤖',
    nome: 'Aleatória',
    descricao: 'Escolhe números totalmente ao acaso. Imprevisível e sem padrão.',
    cor: '#7c5cff',
  },
  {
    id: 'teimosa',
    icone: '🧱',
    nome: 'Teimosa',
    descricao: 'Repete sempre os mesmos números. Teimosa como uma muralha.',
    cor: '#ff5e7a',
  },
  {
    id: 'psicologica',
    icone: '🧠',
    nome: 'Psicológica',
    descricao: 'Aprende seus padrões e contra-ataca. Perigosa contra jogadores previsíveis.',
    cor: '#00d4aa',
  },
  {
    id: 'caotica',
    icone: '🌪️',
    nome: 'Caótica',
    descricao: 'Começa previsível, depois enlouquece. O caos é a única constante.',
    cor: '#ffc857',
  },
]

interface SeletorDeIaProps {
  onSelecionar: (personalidade: PersonalidadeDaIa) => void
  personalidadeSelecionada?: PersonalidadeDaIa
}

export default function SeletorDeIa({
  onSelecionar,
  personalidadeSelecionada,
}: SeletorDeIaProps) {
  return (
    <div className={styles.seletor}>
      <h2 className={styles.titulo}>Escolha sua oponente</h2>
      <p className={styles.subtitulo}>
        Cada IA tem uma personalidade única. Qual você quer enfrentar?
      </p>

      <div className={styles.grid}>
        {PERSONALIDADES.map((personalidade) => {
          const selecionado =
            personalidadeSelecionada === personalidade.id

          return (
            <button
              key={personalidade.id}
              className={`${styles.card} ${selecionado ? styles.selecionado : ''}`}
              onClick={() => onSelecionar(personalidade.id)}
              style={{
                '--cor-personalidade': personalidade.cor,
              } as React.CSSProperties}
              aria-pressed={selecionado}
              aria-label={`IA ${personalidade.nome}: ${personalidade.descricao}`}
            >
              <span className={styles.icone}>{personalidade.icone}</span>
              <h3 className={styles.nome}>{personalidade.nome}</h3>
              <p className={styles.descricao}>{personalidade.descricao}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
