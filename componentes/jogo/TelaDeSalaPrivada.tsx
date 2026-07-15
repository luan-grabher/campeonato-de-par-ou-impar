'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Share2, Play, Users, Clock, Swords } from 'lucide-react'
import Botao from '@/componentes/ui/Botao'
import CartaoDeJogador from '@/componentes/ui/CartaoDeJogador'
import { usarJogadorAutenticado } from '@/hooks/usarJogadorAutenticado'
import { criarClienteNavegador } from '@/servidor/integracoes/supabase/criarClienteNavegador'
import type { ModoDeJogo } from '@/core/tipos/partida'
import styles from './TelaDeSalaPrivada.module.css'

interface DadosDaSala {
  id: string
  codigo: string
  titulo: string
  idDoAnfitriao: string
  totalDeRodadas: 3 | 5 | 7
  modoDeJogo: ModoDeJogo
  status: 'aguardando_oponente' | 'em_andamento' | 'finalizada' | 'cancelada'
}

interface InformacaoDoAnfitriao {
  id: string
  nome: string
  elo: number
  urlDoAvatar?: string | null
}

interface TelaDeSalaPrivadaProps {
  sala: DadosDaSala
  onIniciarPartida: () => void
  carregando?: boolean
}

const NOMES_DOS_MODOS: Record<string, string> = {
  classico: 'Clássico',
  dificil: 'Difícil',
  relampago: 'Relâmpago',
  invisivel: 'Invisível',
  caos: 'Caos',
  sobrevivencia: 'Sobrevivência',
}

export default function TelaDeSalaPrivada({
  sala,
  onIniciarPartida,
  carregando = false,
}: TelaDeSalaPrivadaProps) {
  const router = useRouter()
  const { jogador } = usarJogadorAutenticado()
  const [copiado, setCopiado] = useState(false)
  const [anfitriao, setAnfitriao] = useState<InformacaoDoAnfitriao | null>(null)
  const [segundoJogador, setSegundoJogador] = useState<InformacaoDoAnfitriao | null>(null)
  const [carregandoAnfitriao, setCarregandoAnfitriao] = useState(true)

  const ehAnfitriao = jogador?.id === sala.idDoAnfitriao

  const linkDaSala = typeof window !== 'undefined'
    ? `${window.location.origin}/salas-privadas/${sala.codigo}`
    : ''

  // Carregar dados do anfitrião
  useEffect(() => {
    async function carregarAnfitriao() {
      const supabase = criarClienteNavegador()

      const { data: perfil } = await supabase
        .from('perfis')
        .select('*')
        .eq('id_usuario', sala.idDoAnfitriao)
        .single()

      if (perfil) {
        setAnfitriao({
          id: perfil.id_usuario as string,
          nome: perfil.nome as string,
          elo: perfil.elo as number,
          urlDoAvatar: perfil.url_do_avatar as string | null,
        })
      }

      setCarregandoAnfitriao(false)
    }

    carregarAnfitriao()
  }, [sala.idDoAnfitriao])

  // Escutar Realtime para quando um jogador entrar
  useEffect(() => {
    if (sala.status !== 'aguardando_oponente') return

    const supabase = criarClienteNavegador()
    const channel = supabase.channel(`sala:${sala.id}`)

    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return
    })

    channel.on(
      'broadcast',
      { event: 'jogador_entrou' },
      (payload) => {
        const dados = payload as unknown as {
          idDaPartida: string
          idDoSegundoJogador: string
          nomeDoSegundoJogador: string
        }

        // Carregar dados do segundo jogador
        async function carregarSegundo() {
          const { data: perfil } = await supabase
            .from('perfis')
            .select('*')
            .eq('id_usuario', dados.idDoSegundoJogador)
            .single()

          if (perfil) {
            setSegundoJogador({
              id: perfil.id_usuario as string,
              nome: perfil.nome as string,
              elo: perfil.elo as number,
              urlDoAvatar: perfil.url_do_avatar as string | null,
            })
          }
        }

        carregarSegundo()
      }
    )

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sala.id, sala.status])

  const lidarCopiar = useCallback(async () => {
    if (!linkDaSala) return

    try {
      await navigator.clipboard.writeText(linkDaSala)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Fallback para seleção manual
      const input = document.createElement('input')
      input.value = linkDaSala
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }, [linkDaSala])

  const lidarCompartilhar = useCallback(async () => {
    if (!linkDaSala) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: sala.titulo,
          text: `Vem jogar "${sala.titulo}" comigo! Código: ${sala.codigo}`,
          url: linkDaSala,
        })
      } catch {
        // Usuário cancelou
      }
    } else {
      lidarCopiar()
    }
  }, [linkDaSala, sala.titulo, sala.codigo, lidarCopiar])

  const mostrandoAguardando = sala.status === 'aguardando_oponente' && !segundoJogador
  const ambosPresentes = anfitriao && (segundoJogador || sala.status !== 'aguardando_oponente')

  if (carregandoAnfitriao) {
    return (
      <div className={styles.container}>
        <div className={styles.carregando}>Carregando sala...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Cabeçalho */}
        <div className={styles.cabecalho}>
          <h1 className={styles.titulo}>{sala.titulo}</h1>
          <span className={styles.statusBadge}>
            {sala.status === 'aguardando_oponente' && 'Aguardando oponente'}
            {sala.status === 'em_andamento' && 'Em andamento'}
            {sala.status === 'finalizada' && 'Finalizada'}
            {sala.status === 'cancelada' && 'Cancelada'}
          </span>
        </div>

        {/* Código da Sala */}
        <div className={styles.secaoCodigo}>
          <span className={styles.labelCodigo}>Código da Sala</span>
          <div className={styles.codigoContainer}>
            <span className={styles.codigo}>{sala.codigo}</span>
            <button
              className={styles.botaoCopiar}
              onClick={lidarCopiar}
              title="Copiar link"
              aria-label="Copiar link da sala"
            >
              {copiado ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
          <button className={styles.botaoCompartilhar} onClick={lidarCompartilhar}>
            <Share2 size={16} />
            Compartilhar link
          </button>
        </div>

        {/* Configurações */}
        <div className={styles.configuracoes}>
          <div className={styles.configItem}>
            <Swords size={16} />
            <span>{NOMES_DOS_MODOS[sala.modoDeJogo] ?? sala.modoDeJogo}</span>
          </div>
          <div className={styles.configItem}>
            <Clock size={16} />
            <span>{sala.totalDeRodadas} rodadas</span>
          </div>
        </div>

        {/* Jogadores */}
        <div className={styles.jogadores}>
          <h2 className={styles.jogadoresTitulo}>
            <Users size={18} />
            Jogadores
          </h2>

          <div className={styles.jogadoresLista}>
            {anfitriao && (
              <div className={styles.jogadorItem}>
                <CartaoDeJogador
                  nome={anfitriao.nome}
                  avatarUrl={anfitriao.urlDoAvatar ?? undefined}
                  className={styles.jogadorCartao}
                />
                <span className={styles.tagAnfitriao}>Anfitrião</span>
              </div>
            )}

            {mostrandoAguardando && (
              <div className={styles.jogadorItem}>
                <div className={styles.aguardandoOponente}>
                  <div className={styles.avatarVazio}>
                    <span>?</span>
                  </div>
                  <span className={styles.textoAguardando}>Aguardando oponente...</span>
                </div>
              </div>
            )}

            {segundoJogador && (
              <div className={styles.jogadorItem}>
                <CartaoDeJogador
                  nome={segundoJogador.nome}
                  avatarUrl={segundoJogador.urlDoAvatar ?? undefined}
                  className={styles.jogadorCartao}
                />
                <span className={styles.tagJogador}>Jogador</span>
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className={styles.acoes}>
          {mostrandoAguardando && ehAnfitriao && (
            <Botao
              tamanho="grande"
              larguraTotal
              disabled={true}
            >
              <Users size={18} />
              Aguardando oponente...
            </Botao>
          )}

          {mostrandoAguardando && !ehAnfitriao && (
            <Botao
              tamanho="grande"
              larguraTotal
              carregando={carregando}
              onClick={onIniciarPartida}
            >
              Entrar na Sala
            </Botao>
          )}

          {ambosPresentes && ehAnfitriao && (
            <Botao
              tamanho="grande"
              larguraTotal
              carregando={carregando}
              onClick={onIniciarPartida}
            >
              <Play size={18} />
              Iniciar Partida
            </Botao>
          )}

          {ambosPresentes && !ehAnfitriao && (
            <Botao
              tamanho="grande"
              larguraTotal
              disabled
            >
              Aguardando anfitrião iniciar...
            </Botao>
          )}

          {sala.status === 'finalizada' && (
            <Botao
              tamanho="grande"
              larguraTotal
              onClick={() => router.push('/partida-rapida')}
            >
              Voltar
            </Botao>
          )}
        </div>
      </div>
    </div>
  )
}
