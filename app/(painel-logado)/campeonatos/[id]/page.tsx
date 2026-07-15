import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Users, Calendar } from 'lucide-react'
import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { buscarChaveamentoDoCampeonato } from '@/servidor/acoes/buscarChaveamentoDoCampeonato'
import ChaveamentoDoCampeonato from '@/componentes/jogo/ChaveamentoDoCampeonato'
import Botao from '@/componentes/ui/Botao'
import type { DadosDoCampeonatoCompleto } from '@/servidor/acoes/buscarChaveamentoDoCampeonato'
import styles from './page.module.css'

function formatarStatus(status: string): { rotulo: string; className: string } {
  switch (status) {
    case 'inscricoes_abertas':
      return { rotulo: 'Inscrições Abertas', className: styles.statusAberto ?? '' }
    case 'em_andamento':
      return { rotulo: 'Em Andamento', className: styles.statusAndamento ?? '' }
    case 'finalizado':
      return { rotulo: 'Finalizado', className: styles.statusFinalizado ?? '' }
    case 'cancelado':
      return { rotulo: 'Cancelado', className: styles.statusCancelado ?? '' }
    default:
      return { rotulo: status, className: '' }
  }
}

function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function PaginaDoCampeonato({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await criarClienteServidor()
  const { data: userData } = await supabase.auth.getUser()
  const idDoUsuario = userData?.user?.id ?? null

  const resultado = await buscarChaveamentoDoCampeonato(id)

  if (resultado.status === 'erro') {
    return (
      <div className={styles.pagina}>
        <div className={styles.container}>
          <div className={styles.erro}>
            <h2>Campeonato não encontrado</h2>
            <p>{resultado.mensagem}</p>
            <Link href="/campeonatos">
              <Botao>Voltar para Campeonatos</Botao>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const dados: DadosDoCampeonatoCompleto = resultado.dados
  const statusInfo = formatarStatus(dados.status)

  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        {/* Navegação */}
        <Link href="/campeonatos" className={styles.voltar}>
          <ArrowLeft size={16} />
          Voltar para campeonatos
        </Link>

        {/* Cabeçalho */}
        <div className={styles.cabecalho}>
          <div className={styles.cabecalhoInfo}>
            <h1 className={styles.titulo}>{dados.nome}</h1>
            <div className={styles.meta}>
              <span className={`${styles.status} ${statusInfo.className}`}>
                {statusInfo.rotulo}
              </span>
              <span className={styles.metaItem}>
                <Trophy size={14} />
                Mata-mata
              </span>
              <span className={styles.metaItem}>
                <Users size={14} />
                {dados.totalDeJogadores} jogadores
              </span>
              <span className={styles.metaItem}>
                <Calendar size={14} />
                {formatarData(dados.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Chaveamento */}
        <section className={styles.secao}>
          <ChaveamentoDoCampeonato
            fases={dados.fases}
            idDoUsuario={idDoUsuario}
            participante={dados.participante}
            status={dados.status}
          />
        </section>
      </div>
    </div>
  )
}
