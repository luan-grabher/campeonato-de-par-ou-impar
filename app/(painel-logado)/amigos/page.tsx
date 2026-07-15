'use client'

import { useState } from 'react'
import ListaDeAmigos from '@/componentes/jogo/ListaDeAmigos'
import ConvitesPendentes from '@/componentes/jogo/ConvitesPendentes'
import BuscarJogador from '@/componentes/jogo/BuscarJogador'
import { Users, Mail, Search } from 'lucide-react'
import styles from './page.module.css'

type Aba = 'amigos' | 'convites' | 'buscar'

const ABAS: { id: Aba; rotulo: string; icone: typeof Users }[] = [
  { id: 'amigos', rotulo: 'Amigos', icone: Users },
  { id: 'convites', rotulo: 'Convites', icone: Mail },
  { id: 'buscar', rotulo: 'Buscar Jogadores', icone: Search },
]

export default function PaginaAmigos() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('amigos')

  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <h1 className={styles.titulo}>🤝 Amigos</h1>
        <p className={styles.subtitulo}>
          Conecte-se com outros jogadores
        </p>

        {/* Abas */}
        <nav className={styles.abas} role="tablist">
          {ABAS.map((aba) => {
            const Icone = aba.icone
            return (
              <button
                key={aba.id}
                role="tab"
                aria-selected={abaAtiva === aba.id}
                className={`${styles.aba} ${
                  abaAtiva === aba.id ? styles.abaAtiva : ''
                }`}
                onClick={() => setAbaAtiva(aba.id)}
              >
                <Icone size={16} />
                <span>{aba.rotulo}</span>
              </button>
            )
          })}
        </nav>

        {/* Conteúdo */}
        <div className={styles.conteudo} role="tabpanel">
          {abaAtiva === 'amigos' && <ListaDeAmigos />}
          {abaAtiva === 'convites' && <ConvitesPendentes />}
          {abaAtiva === 'buscar' && <BuscarJogador />}
        </div>
      </div>
    </div>
  )
}
