import { Calendar } from 'lucide-react'
import { buscarTemporadaAtual } from '@/servidor/acoes/buscarTemporadaAtual'
import ProgressoDaTemporada from '@/componentes/jogo/ProgressoDaTemporada'
import styles from './BannerDeTemporada.module.css'

export default async function BannerDeTemporada() {
  const resultado = await buscarTemporadaAtual()

  if (!resultado.sucesso || !resultado.temporada) {
    return null
  }

  const { temporada } = resultado
  const dataInicio = new Date(temporada.data_de_inicio)
  const dataFim = new Date(temporada.data_de_fim)

  return (
    <div className={styles.banner}>
      <div className={styles.conteudo}>
        <div className={styles.info}>
          <Calendar className={styles.icone} aria-hidden="true" size={16} />
          <span className={styles.nome}>{temporada.nome}</span>
        </div>
        <ProgressoDaTemporada dataDeInicio={dataInicio.toISOString()} dataDeFim={dataFim.toISOString()} />
      </div>
    </div>
  )
}
