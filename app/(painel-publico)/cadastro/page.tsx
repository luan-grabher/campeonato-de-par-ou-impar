import FormularioDeCadastro from '@/componentes/ui/FormularioDeCadastro'
import styles from './cadastro.module.css'

export default function PaginaDeCadastro() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.titulo}>Criar conta</h1>
        <p className={styles.subtitulo}>
          Crie sua conta para jogar partidas online
        </p>

        <FormularioDeCadastro />

        <p className={styles.termos}>
          Ao criar uma conta, você concorda com nossos{' '}
          <a href="/termos">Termos de Serviço</a> e{' '}
          <a href="/privacidade">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  )
}
