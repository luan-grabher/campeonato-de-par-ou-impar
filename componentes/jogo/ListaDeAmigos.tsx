'use client'

import { useState, useEffect, useCallback } from 'react'
import CartaoDeJogador from '@/componentes/ui/CartaoDeJogador'
import BadgeDeElo from '@/componentes/ui/BadgeDeElo'
import Botao from '@/componentes/ui/Botao'
import { chamarApi } from '@/hooks/usarApiCliente'
import { determinarFaixaDoElo } from '@/core/constantes/faixasDeElo'
import { UserMinus, Users } from 'lucide-react'
import styles from './ListaDeAmigos.module.css'

interface DadosDoAmigo {
  id: string
  nome: string
  urlDoAvatar: string | null
  elo: number
  online: boolean
}

function badgeKeyFromNome(nome: string): string {
  const mapa: Record<string, string> = {
    Bronze: 'bronze',
    Prata: 'prata',
    Ouro: 'ouro',
    Platina: 'platina',
    Diamante: 'diamante',
    Mestre: 'mestre',
    'Lendário': 'lendario',
  }
  return mapa[nome] ?? 'ferro'
}

export default function ListaDeAmigos() {
  const [amigos, setAmigos] = useState<DadosDoAmigo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [amigoParaRemover, setAmigoParaRemover] = useState<string | null>(null)
  const [removendo, setRemovendo] = useState(false)

  const carregarAmigos = useCallback(async () => {
    setCarregando(true)
    const dados = await chamarApi('/api/amigos', { acao: 'buscar-lista' })
    setAmigos(dados)
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregarAmigos()
  }, [carregarAmigos])

  async function handleRemover(id: string) {
    setRemovendo(true)
    const resultado = await chamarApi('/api/amigos', { acao: 'remover-amigo', idDoAmigo: id })
    if (resultado.status === 'sucesso') {
      setAmigos((prev) => prev.filter((a) => a.id !== id))
    }
    setAmigoParaRemover(null)
    setRemovendo(false)
  }

  if (carregando) {
    return (
      <div className={styles.container}>
        <p className={styles.vazio}>Carregando amigos...</p>
      </div>
    )
  }

  if (amigos.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.vazioIcone}>
          <Users size={48} />
        </div>
        <p className={styles.vazioTitulo}>Nenhum amigo ainda</p>
        <p className={styles.vazioDescricao}>
          Use a aba "Buscar Jogadores" para encontrar e adicionar outros jogadores.
        </p>
      </div>
    )
  }

  const online = amigos.filter((a) => a.online)
  const offline = amigos.filter((a) => !a.online)

  return (
    <div className={styles.container}>
      {online.length > 0 && (
        <section className={styles.secao}>
          <h3 className={styles.secaoTitulo}>
            Online <span className={styles.contagem}>({online.length})</span>
          </h3>
          <div className={styles.lista}>
            {online.map((amigo) => (
              <AmigoItem
                key={amigo.id}
                amigo={amigo}
                onRemover={setAmigoParaRemover}
              />
            ))}
          </div>
        </section>
      )}

      {offline.length > 0 && (
        <section className={styles.secao}>
          <h3 className={styles.secaoTitulo}>
            Offline <span className={styles.contagem}>({offline.length})</span>
          </h3>
          <div className={styles.lista}>
            {offline.map((amigo) => (
              <AmigoItem
                key={amigo.id}
                amigo={amigo}
                onRemover={setAmigoParaRemover}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modal de confirmação de remoção */}
      {amigoParaRemover && (
        <div className={styles.overlay} onClick={() => setAmigoParaRemover(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTexto}>
              Tem certeza que deseja remover este amigo?
            </p>
            <div className={styles.modalAcoes}>
              <Botao
                variante="ghost"
                onClick={() => setAmigoParaRemover(null)}
              >
                Cancelar
              </Botao>
              <Botao
                variante="perigo"
                carregando={removendo}
                onClick={() => handleRemover(amigoParaRemover)}
              >
                Remover
              </Botao>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AmigoItem({
  amigo,
  onRemover,
}: {
  amigo: DadosDoAmigo
  onRemover: (id: string) => void
}) {
  const faixa = badgeKeyFromNome(determinarFaixaDoElo(amigo.elo).nome)

  return (
    <div className={styles.item}>
      <div className={styles.itemInfo}>
        <CartaoDeJogador
          nome={amigo.nome}
          avatarUrl={amigo.urlDoAvatar ?? undefined}
          elo={<BadgeDeElo faixa={faixa} />}
        />
      </div>
      <div className={styles.itemAcoes}>
        <span
          className={amigo.online ? styles.statusOnline : styles.statusOffline}
          title={amigo.online ? 'Online' : 'Offline'}
        />
        <button
          className={styles.botaoRemover}
          onClick={() => onRemover(amigo.id)}
          title="Remover amigo"
          aria-label={`Remover ${amigo.nome} dos amigos`}
        >
          <UserMinus size={16} />
        </button>
      </div>
    </div>
  )
}
