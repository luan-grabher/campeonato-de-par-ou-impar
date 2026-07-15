'use client'

import { useState, useEffect, useCallback } from 'react'
import CartaoDeJogador from '@/componentes/ui/CartaoDeJogador'
import BadgeDeElo from '@/componentes/ui/BadgeDeElo'
import Botao from '@/componentes/ui/Botao'
import { buscarConvitesPendentes } from '@/servidor/acoes/buscarConvitesPendentes'
import { aceitarConviteDeAmizade } from '@/servidor/acoes/aceitarConviteDeAmizade'
import { recusarConviteDeAmizade } from '@/servidor/acoes/recusarConviteDeAmizade'
import { determinarFaixaDoElo } from '@/core/constantes/faixasDeElo'
import { Mail, Check, X, UserPlus } from 'lucide-react'
import type { DadosDoConvite } from '@/servidor/acoes/buscarConvitesPendentes'
import styles from './ConvitesPendentes.module.css'

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

export default function ConvitesPendentes() {
  const [convites, setConvites] = useState<DadosDoConvite[]>([])
  const [carregando, setCarregando] = useState(true)
  const [conviteEmAcao, setConviteEmAcao] = useState<string | null>(null)

  const carregarConvites = useCallback(async () => {
    setCarregando(true)
    const dados = await buscarConvitesPendentes()
    setConvites(dados)
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregarConvites()
  }, [carregarConvites])

  async function handleAceitar(id: string) {
    setConviteEmAcao(id)
    const resultado = await aceitarConviteDeAmizade(id)
    if (resultado.status === 'sucesso') {
      setConvites((prev) => prev.filter((c) => c.id !== id))
    }
    setConviteEmAcao(null)
  }

  async function handleRecusar(id: string) {
    setConviteEmAcao(id)
    const resultado = await recusarConviteDeAmizade(id)
    if (resultado.status === 'sucesso') {
      setConvites((prev) => prev.filter((c) => c.id !== id))
    }
    setConviteEmAcao(null)
  }

  if (carregando) {
    return (
      <div className={styles.container}>
        <p className={styles.vazio}>Carregando convites...</p>
      </div>
    )
  }

  if (convites.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.vazioIcone}>
          <UserPlus size={48} />
        </div>
        <p className={styles.vazioTitulo}>Nenhum convite pendente</p>
        <p className={styles.vazioDescricao}>
          Os convites de amizade que você receber aparecerão aqui.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.titulo}>
        Convites Recebidos
        <span className={styles.contagem}>({convites.length})</span>
      </h3>

      <div className={styles.lista}>
        {convites.map((convite) => {
          const faixa = badgeKeyFromNome(determinarFaixaDoElo(convite.eloDoRemetente).nome)
          return (
            <div key={convite.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <CartaoDeJogador
                  nome={convite.nomeDoRemetente}
                  avatarUrl={convite.urlDoAvatarDoRemetente ?? undefined}
                  elo={<BadgeDeElo faixa={faixa} />}
                />
              </div>
              <div className={styles.itemAcoes}>
                <Botao
                  variante="primario"
                  tamanho="pequeno"
                  carregando={conviteEmAcao === convite.id}
                  onClick={() => handleAceitar(convite.id)}
                  title="Aceitar"
                >
                  <Check size={16} />
                  <span>Aceitar</span>
                </Botao>
                <Botao
                  variante="ghost"
                  tamanho="pequeno"
                  disabled={conviteEmAcao === convite.id}
                  onClick={() => handleRecusar(convite.id)}
                  title="Recusar"
                >
                  <X size={16} />
                  <span>Recusar</span>
                </Botao>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
