'use client'

import { usarJogadorAutenticado } from '@/hooks/usarJogadorAutenticado'
import TelaDeSobrevivencia from '@/componentes/jogo/TelaDeSobrevivencia'
import ListaDeParticipantesDoSobrevivencia from '@/componentes/jogo/ListaDeParticipantesDoSobrevivencia'
import styles from './page.module.css'

export default function PaginaModoSobrevivencia() {
  const { jogador, carregando } = usarJogadorAutenticado()

  if (carregando) {
    return (
      <div className={styles.pagina}>
        <div className={styles.carregando}>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!jogador) {
    return (
      <div className={styles.pagina}>
        <div className={styles.erro}>
          <h2>Não autenticado</h2>
          <p>Faça login para jogar no modo Sobrevivência.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.layout}>
        <div className={styles.colunaPrincipal}>
          <TelaDeSobrevivencia idDoJogador={jogador.id} />
        </div>

        <aside className={styles.colunaLateral}>
          <div className={styles.cardLateral}>
            <h2 className={styles.tituloLateral}>Regras</h2>
            <ul className={styles.regras}>
              <li>Vários jogadores entram na fila</li>
              <li>Dois jogadores são pareados por vez</li>
              <li>Quem perde a partida é eliminado</li>
              <li>Quem vence continua na fila</li>
              <li>O último sobrevivente é o campeão!</li>
              <li>O campeão ganha Elo extra de bônus</li>
            </ul>
          </div>

          <div className={styles.cardLateral}>
            <ListaDeParticipantesDoSobrevivencia
              idDoJogador={jogador.id}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
