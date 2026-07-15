import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { iniciarPartidaContraIa } from '@/servidor/acoes/iniciarPartidaContraIa'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import FormularioDeInicioPartida from './FormularioDeInicioPartida'
import styles from './partida-rapida-ia.module.css'

export default async function PaginaInicioPartidaContraIa() {
  /* Verifica se o usuário já está logado */
  let nomeDoJogador: string | null = null

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Apenas leitura
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      nomeDoJogador =
        user.user_metadata?.apelido ??
        user.email?.split('@')[0] ??
        'Jogador'
    }
  } catch {
    // Falha ao ler sessão — segue como deslogado
  }

  /* Se logado, já cria a partida e redireciona direto pro jogo */
  if (nomeDoJogador) {
    const resultado = await iniciarPartidaContraIa(nomeDoJogador)
    redirect(
      `/partida-rapida-ia/jogo?id=${resultado.idDaPartida}&nome=${encodeURIComponent(nomeDoJogador)}`
    )
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <Link
          href="/partida-rapida"
          className={styles.voltar}
        >
          <ArrowLeft size={20} />
          Voltar
        </Link>

        <div className={styles.cabecalho}>
          <h1 className={styles.titulo}>🤖 Partida contra IA</h1>
          <p className={styles.descricao}>
            Treine suas habilidades contra uma inteligência artificial.
            Melhor de 3 rodadas!
          </p>
        </div>

        <FormularioDeInicioPartida />
      </div>
    </div>
  )
}
