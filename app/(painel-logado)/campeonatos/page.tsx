'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Plus } from 'lucide-react'
import ListaDeCampeonatos from '@/componentes/jogo/ListaDeCampeonatos'
import Botao from '@/componentes/ui/Botao'
import { buscarCampeonatosAtivos } from '@/servidor/acoes/buscarCampeonatosAtivos'
import { inscreverNoCampeonato } from '@/servidor/acoes/inscreverNoCampeonato'
import { cancelarInscricaoNoCampeonato } from '@/servidor/acoes/cancelarInscricaoNoCampeonato'
import type { CampeonatoAtivo } from '@/servidor/acoes/buscarCampeonatosAtivos'
import styles from './page.module.css'

export default function PaginaCampeonatos() {
  const router = useRouter()
  const [campeonatos, setCampeonatos] = useState<CampeonatoAtivo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [carregandoId, setCarregandoId] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    const resultado = await buscarCampeonatosAtivos()
    if (resultado.status === 'sucesso') {
      setCampeonatos(resultado.campeonatos)
    } else {
      setErro(resultado.mensagem)
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const handleInscrever = async (id: string) => {
    setCarregandoId(id)
    const resultado = await inscreverNoCampeonato(id)
    if (resultado.status === 'sucesso') {
      await carregar()
    } else {
      setErro(resultado.mensagem)
    }
    setCarregandoId(null)
  }

  const handleCancelarInscricao = async (id: string) => {
    setCarregandoId(id)
    const resultado = await cancelarInscricaoNoCampeonato(id)
    if (resultado.status === 'sucesso') {
      await carregar()
    } else {
      setErro(resultado.mensagem)
    }
    setCarregandoId(null)
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <div className={styles.cabecalho}>
          <div>
            <h1 className={styles.titulo}>
              <Trophy className={styles.tituloIcone} size={28} />
              Campeonatos
            </h1>
            <p className={styles.subtitulo}>
              Participe de campeonatos mata-mata e dispute o título!
            </p>
          </div>
          <Botao onClick={() => router.push('/campeonatos/criar')}>
            <Plus size={16} /> Novo Campeonato
          </Botao>
        </div>

        {erro && (
          <div className={styles.erro}>
            <p>{erro}</p>
            <Botao variante="ghost" tamanho="pequeno" onClick={() => setErro(null)}>
              Fechar
            </Botao>
          </div>
        )}

        {carregando ? (
          <div className={styles.carregando}>
            <p>Carregando campeonatos...</p>
          </div>
        ) : (
          <ListaDeCampeonatos
            campeonatos={campeonatos}
            idDoUsuario={null}
            onInscrever={handleInscrever}
            onCancelarInscricao={handleCancelarInscricao}
            carregandoId={carregandoId}
          />
        )}
      </div>
    </div>
  )
}
