'use client'

import { useEffect, useState } from 'react'
import { Skull, Trophy, User } from 'lucide-react'
import { criarClienteNavegador } from '@/servidor/integracoes/supabase/criarClienteNavegador'
import styles from './ListaDeParticipantesDoSobrevivencia.module.css'

interface Participante {
  id: string
  nome: string
  avatarUrl: string | null
  vitoriasConsecutivas: number
}

interface ListaDeParticipantesDoSobrevivenciaProps {
  jogadorNaFila?: boolean
  idDoJogador?: string
}

export default function ListaDeParticipantesDoSobrevivencia({
  jogadorNaFila,
  idDoJogador,
}: ListaDeParticipantesDoSobrevivenciaProps) {
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function buscarParticipantes() {
      try {
        const supabase = criarClienteNavegador()

        const { data: fila } = await supabase
          .from('fila_de_sobrevivencia')
          .select(`
            id_do_jogador,
            vitorias_consecutivas,
            perfis!inner(id_usuario, nome, url_do_avatar)
          `)
          .order('created_at', { ascending: true })

        if (fila) {
          const participantesMapeados: Participante[] = fila.map((item: Record<string, unknown>) => {
            const perfil = item.perfis as Record<string, unknown>
            return {
              id: item.id_do_jogador as string,
              nome: (perfil?.nome as string) ?? 'Desconhecido',
              avatarUrl: (perfil?.url_do_avatar as string | null) ?? null,
              vitoriasConsecutivas: (item.vitorias_consecutivas as number) ?? 0,
            }
          })
          setParticipantes(participantesMapeados)
        }
      } catch {
        // Ignorar erros
      } finally {
        setCarregando(false)
      }
    }

    buscarParticipantes()
    const intervalo = setInterval(buscarParticipantes, 5000)
    return () => clearInterval(intervalo)
  }, [])

  if (carregando) {
    return (
      <div className={styles.container}>
        <p className={styles.carregando}>Carregando participantes...</p>
      </div>
    )
  }

  if (participantes.length === 0 && !jogadorNaFila) {
    return (
      <div className={styles.container}>
        <div className={styles.vazio}>
          <User size={32} className={styles.iconeVazio} />
          <p>Nenhum jogador na fila de sobrevivência</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.titulo}>
        Participantes na Fila
        <span className={styles.contagem}>({participantes.length})</span>
      </h3>

      <div className={styles.lista}>
        {participantes.map((participante, index) => (
          <div
            key={participante.id}
            className={`${styles.item} ${participante.id === idDoJogador ? styles.itemAtual : ''}`}
          >
            <span className={styles.posicao}>#{index + 1}</span>

            <div className={styles.avatar}>
              {participante.avatarUrl ? (
                <img src={participante.avatarUrl} alt={participante.nome} className={styles.avatarImagem} />
              ) : (
                <span>{participante.nome.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className={styles.info}>
              <span className={styles.nome}>
                {participante.nome}
                {participante.id === idDoJogador && ' (Você)'}
              </span>
              <span className={styles.status}>
                <Trophy size={12} />
                Vivo · {participante.vitoriasConsecutivas} vitória(s)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
