import { criarClienteServidor } from '@/servidor/integracoes/supabase/criarClienteServidor'
import { buscarCosmeticosDisponiveis } from '@/servidor/acoes/buscarCosmeticosDisponiveis'
import LojaDeCosmeticos from '@/componentes/jogo/LojaDeCosmeticos'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function PaginaLoja() {
  const supabase = await criarClienteServidor()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [resultadoCosmeticos, resultadoPerfil] = await Promise.all([
    buscarCosmeticosDisponiveis(),
    user
      ? supabase
          .from('perfis')
          .select('moedas')
          .eq('id_usuario', user.id)
          .single()
      : { data: null, error: null },
  ])

  const moedas = resultadoPerfil?.data?.moedas ?? 0

  if ('erro' in resultadoCosmeticos) {
    return (
      <div className={styles.container}>
        <h1 className={styles.titulo}>Loja</h1>
        <p className={styles.erro}>{resultadoCosmeticos.erro}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.cabecalho}>
        <h1 className={styles.titulo}>Loja de Cosméticos</h1>
        <p className={styles.subtitulo}>
          Personalize sua experiência com avatares, molduras, efeitos e mais!
        </p>
      </div>

      <LojaDeCosmeticos cosmeticos={resultadoCosmeticos} moedas={moedas} />
    </div>
  )
}
