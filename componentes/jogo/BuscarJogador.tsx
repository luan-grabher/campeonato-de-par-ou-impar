'use client'

import { useState, useCallback } from 'react'
import CartaoDeJogador from '@/componentes/ui/CartaoDeJogador'
import BadgeDeElo from '@/componentes/ui/BadgeDeElo'
import Botao from '@/componentes/ui/Botao'
import InputTexto from '@/componentes/ui/InputTexto'
import { chamarApi } from '@/hooks/usarApiCliente'
import { determinarFaixaDoElo } from '@/core/constantes/faixasDeElo'
import { Search, UserPlus, Check, Clock, Loader2 } from 'lucide-react'
import styles from './BuscarJogador.module.css'

interface ResultadoBuscaJogador {
  id: string
  nome: string
  urlDoAvatar: string | null
  elo: number
  convitePendenteEnviado?: boolean
  convitePendenteRecebido?: boolean
  jaEhAmigo?: boolean
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

export default function BuscarJogador() {
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<ResultadoBuscaJogador[]>([])
  const [carregando, setCarregando] = useState(false)
  const [buscou, setBuscou] = useState(false)
  const [jogadorEmAcao, setJogadorEmAcao] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const handleBuscar = useCallback(async () => {
    if (termo.trim().length < 2) return

    setCarregando(true)
    setBuscou(true)
    setMensagem(null)

    const dados = await chamarApi('/api/perfil', { acao: 'buscar-jogador', nome: termo })
    setResultados(dados)
    setCarregando(false)
  }, [termo])

  async function handleConvidar(id: string) {
    setJogadorEmAcao(id)
    setMensagem(null)

    const resultado = await chamarApi('/api/amigos', { acao: 'enviar-convite', idDoDestinatario: id })
    if (resultado.status === 'sucesso') {
      setResultados((prev) =>
        prev.map((j) =>
          j.id === id ? { ...j, convitePendenteEnviado: true } : j
        )
      )
      setMensagem('Convite enviado com sucesso!')
    } else {
      setMensagem(resultado.mensagem)
    }

    setJogadorEmAcao(null)

    // Limpar mensagem após alguns segundos
    setTimeout(() => setMensagem(null), 4000)
  }

  function getBotaoEstado(jogador: ResultadoBuscaJogador) {
    if (jogador.jaEhAmigo) {
      return {
        texto: 'Amigo',
        icone: Check,
        desabilitado: true,
        variante: 'secundario' as const,
        acao: undefined,
      }
    }
    if (jogador.convitePendenteEnviado) {
      return {
        texto: 'Convidado',
        icone: Clock,
        desabilitado: true,
        variante: 'secundario' as const,
        acao: undefined,
      }
    }
    if (jogador.convitePendenteRecebido) {
      return {
        texto: 'Convidou você',
        icone: UserPlus,
        desabilitado: false,
        variante: 'primario' as const,
        acao: () => handleConvidar(jogador.id),
      }
    }
    return {
      texto: 'Convidar',
      icone: UserPlus,
      desabilitado: false,
      variante: 'primario' as const,
      acao: () => handleConvidar(jogador.id),
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.busca}>
        <InputTexto
          placeholder="Digite o nome do jogador..."
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleBuscar()
          }}
        />
        <Botao
          onClick={handleBuscar}
          carregando={carregando}
          disabled={termo.trim().length < 2}
        >
          <Search size={16} />
          <span>Buscar</span>
        </Botao>
      </div>

      {mensagem && (
        <div className={styles.mensagem}>{mensagem}</div>
      )}

      {carregando && (
        <div className={styles.carregando}>
          <Loader2 size={20} className={styles.spinner} />
          <span>Buscando jogadores...</span>
        </div>
      )}

      {!carregando && buscou && resultados.length === 0 && (
        <div className={styles.semResultados}>
          <p>Nenhum jogador encontrado com esse nome.</p>
        </div>
      )}

      {!carregando && resultados.length > 0 && (
        <div className={styles.resultados}>
          {resultados.map((jogador) => {
            const faixa = badgeKeyFromNome(determinarFaixaDoElo(jogador.elo).nome)
            const botao = getBotaoEstado(jogador)

            return (
              <div key={jogador.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <CartaoDeJogador
                    nome={jogador.nome}
                    avatarUrl={jogador.urlDoAvatar ?? undefined}
                    elo={<BadgeDeElo faixa={faixa} />}
                  />
                </div>
                <div className={styles.itemAcao}>
                  {botao.acao ? (
                    <Botao
                      variante={botao.variante}
                      tamanho="pequeno"
                      carregando={jogadorEmAcao === jogador.id}
                      onClick={botao.acao}
                    >
                      <botao.icone size={14} />
                      <span>{botao.texto}</span>
                    </Botao>
                  ) : (
                    <span className={styles.estadoInfo}>
                      <botao.icone size={14} />
                      <span>{botao.texto}</span>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
