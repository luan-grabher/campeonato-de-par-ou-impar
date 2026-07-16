'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import TabuleiroDeParOuImpar from '@/componentes/jogo/TabuleiroDeParOuImpar'
import { chamarApi } from '@/hooks/usarApiCliente'
import styles from './jogo.module.css'

type EstadoDaPagina =
  | { tipo: 'VALIDANDO' }
  | { tipo: 'VALIDA'; idDaPartida: string; nomeDoJogador: string }

function ConteudoDoJogo() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')

  const [estado, setEstado] = useState<EstadoDaPagina>({ tipo: 'VALIDANDO' })

  useEffect(() => {
    if (!id) {
      criarERedirecionar(router)
      return
    }

    const idDaPartida = id

    async function validar() {
      try {
        const resultado = await chamarApi<{ valida: boolean; nomeDoJogador?: string }>(
          '/api/partida-contra-ia/validar',
          { idDaPartida }
        )

        if (resultado.valida && resultado.nomeDoJogador) {
          setEstado({ tipo: 'VALIDA', idDaPartida, nomeDoJogador: resultado.nomeDoJogador })
        } else {
          await criarERedirecionar(router)
        }
      } catch {
        await criarERedirecionar(router)
      }
    }

    validar()
  }, [id, router])

  // Carregando enquanto valida ou redireciona
  if (estado.tipo === 'VALIDANDO') {
    return (
      <div className={styles.carregando}>
        <p>Preparando partida...</p>
      </div>
    )
  }

  // Partida válida — exibe o jogo
  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <TabuleiroDeParOuImpar
          key={estado.idDaPartida}
          idDaPartida={estado.idDaPartida}
          nomeDoJogador={estado.nomeDoJogador}
          totalDeRodadas={3}
          minimo={1}
          maximo={2}
        />
      </div>
    </div>
  )
}

async function criarERedirecionar(router: ReturnType<typeof useRouter>) {
  try {
    const novaPartida = await chamarApi<{ idDaPartida: string }>(
      '/api/partida-contra-ia/iniciar',
      {}
    )
    router.replace(
      `/partida-rapida-ia/jogo?id=${novaPartida.idDaPartida}`
    )
  } catch {
    router.replace('/partida-rapida-ia')
  }
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
