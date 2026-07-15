'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import TabuleiroDeParOuImpar from '@/componentes/jogo/TabuleiroDeParOuImpar'
import Botao from '@/componentes/ui/Botao'
import styles from './jogo.module.css'

function ConteudoDoJogo() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')
  const nome = searchParams.get('nome')

  if (!id || !nome) {
    return (
      <div className={styles.naoEncontrado}>
        <p className={styles.textoNaoEncontrado}>
          Nenhuma partida em andamento.
        </p>
        <Botao
          variante="primario"
          tamanho="grande"
          onClick={() => router.push('/partida-rapida-ia')}
        >
          Iniciar Nova Partida
        </Botao>
      </div>
    )
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <TabuleiroDeParOuImpar
          key={id}
          idDaPartida={id}
          nomeDoJogador={nome}
          totalDeRodadas={3}
          minimo={1}
          maximo={2}
        />
      </div>
    </div>
  )
}

export default function PaginaJogoContraIa() {
  return (
    <Suspense
      fallback={
        <div className={styles.carregando}>
          <p>Carregando partida...</p>
        </div>
      }
    >
      <ConteudoDoJogo />
    </Suspense>
  )
}
