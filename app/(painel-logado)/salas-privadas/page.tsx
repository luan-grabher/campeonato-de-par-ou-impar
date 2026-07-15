import Link from 'next/link'
import { Plus, Link2, ExternalLink, Lock } from 'lucide-react'
import styles from './page.module.css'

export default function PaginaSalasPrivadas() {
  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <div className={styles.cabecalho}>
          <div>
            <h1 className={styles.titulo}>🔑 Salas Privadas</h1>
            <p className={styles.subtitulo}>
              Crie ou entre em uma sala com código único para jogar com amigos
            </p>
          </div>
          <Link href="/salas-privadas/criar" className={styles.botaoCriar}>
            <Plus size={20} />
            Criar Sala
          </Link>
        </div>

        <div className={styles.opcoes}>
          <Link href="/salas-privadas/criar" className={styles.card}>
            <div className={styles.cardIcone}>
              <Plus size={28} />
            </div>
            <div className={styles.cardInfo}>
              <h2 className={styles.cardNome}>Criar Nova Sala</h2>
              <p className={styles.cardDescricao}>
                Crie uma sala privada, compartilhe o código e jogue com um amigo.
              </p>
            </div>
            <ExternalLink size={20} className={styles.cardSeta} />
          </Link>

          <div className={styles.cardEntrar}>
            <div className={styles.cardIcone}>
              <Link2 size={28} />
            </div>
            <div className={styles.cardEntrarInfo}>
              <h2 className={styles.cardNome}>Entrar em uma Sala</h2>
              <p className={styles.cardDescricao}>
                Recebeu um código de sala? Acesse o link compartilhado pelo seu amigo
                para entrar na partida.
              </p>
              <div className={styles.dicaCodigo}>
                <Lock size={14} />
                O link tem o formato: <code>/salas-privadas/ABC123</code>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.infoAdicional}>
          <h3 className={styles.infoTitulo}>Como funciona?</h3>
          <ol className={styles.infoLista}>
            <li>Crie uma sala e defina as configurações da partida</li>
            <li>Compartilhe o código de 6 caracteres com seu amigo</li>
            <li>Seu amigo acessa o link e entra na sala</li>
            <li>O anfitrião inicia a partida quando todos estiverem prontos</li>
            <li>Jogue normalmente — o resultado conta no ranking!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
