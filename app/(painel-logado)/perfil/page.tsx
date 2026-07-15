import Link from 'next/link'
import { redirect } from 'next/navigation'
import BadgeDeElo from '@/componentes/ui/BadgeDeElo'
import { determinarFaixaDoElo } from '@/core/constantes/faixasDeElo'
import { buscarPerfilCompleto } from '@/servidor/acoes/buscarPerfilCompleto'
import EstatisticasDoPerfil from '@/componentes/jogo/EstatisticasDoPerfil'
import GraficoDeDistribuicaoDeNumeros from '@/componentes/jogo/GraficoDeDistribuicaoDeNumeros'
import styles from './page.module.css'

function obterEmojiDoPais(codigo: string | null): string {
  if (!codigo || codigo.length !== 2) return ''
  const codePoints = codigo
    .toUpperCase()
    .split('')
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)
  return String.fromCodePoint(...codePoints)
}

export default async function PaginaPerfil() {
  const resultado = await buscarPerfilCompleto()

  if ('erro' in resultado) {
    if (resultado.erro === 'Usuário não autenticado.') {
      redirect('/login')
    }
    return (
      <div className={styles.pagina}>
        <div className={styles.container}>
          <div className={styles.erro}>
            <p>{resultado.erro}</p>
            <Link href="/" className={styles.botaoVoltar}>
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { perfil, estatisticas, historicoRecente, campeonatosVencidos, numeroFavorito, numeroMenosUsado } =
    resultado

  const faixa = determinarFaixaDoElo(perfil.elo)
  const iniciais = perfil.nome
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const bandeira = obterEmojiDoPais(perfil.pais)

  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        {/* Cabeçalho do Perfil */}
        <div className={styles.cabecalho}>
          <div className={styles.avatarGrande}>
            {perfil.urlDoAvatar ? (
              <img
                src={perfil.urlDoAvatar}
                alt={perfil.nome}
                className={styles.avatarImagem}
              />
            ) : (
              <span className={styles.avatarIniciais}>{iniciais}</span>
            )}
          </div>

          <div className={styles.infoPrincipal}>
            <h1 className={styles.nome}>
              {bandeira && <span className={styles.bandeira}>{bandeira}</span>}
              {perfil.nome}
            </h1>
            <div className={styles.eloWrapper}>
              <BadgeDeElo faixa={faixa.nome} />
              <span className={styles.pontosElo}>{perfil.elo} pts</span>
            </div>
          </div>

          <Link href="/perfil/editar" className={styles.botaoEditar}>
            Editar Perfil
          </Link>
        </div>

        {/* Estatísticas */}
        <section className={styles.secao}>
          <h2 className={styles.secaoTitulo}>Estatísticas</h2>
          <EstatisticasDoPerfil
            perfil={perfil}
            estatisticas={estatisticas}
            campeonatosVencidos={campeonatosVencidos}
            numeroFavorito={numeroFavorito}
            numeroMenosUsado={numeroMenosUsado}
          />
        </section>

        {/* Gráfico de Distribuição */}
        <section className={styles.secao}>
          <GraficoDeDistribuicaoDeNumeros
            frequenciaDosNumeros={estatisticas.frequenciaDosNumeros}
          />
        </section>

        {/* Histórico Recente */}
        <section className={styles.secao}>
          <h2 className={styles.secaoTitulo}>Histórico Recente</h2>
          {historicoRecente.length > 0 ? (
            <div className={styles.historico}>
              {historicoRecente.map((partida) => (
                <div key={partida.id} className={styles.itemHistorico}>
                  <div className={styles.historicoInfo}>
                    <span className={styles.historicoModo}>
                      {traduzirModo(partida.modo)}
                    </span>
                    <span className={styles.historicoAdversario}>
                      vs {partida.adversario}
                    </span>
                  </div>
                  <span
                    className={`${styles.historicoResultado} ${
                      partida.resultado === 'vitoria'
                        ? styles.resultadoVitoria
                        : partida.resultado === 'derrota'
                          ? styles.resultadoDerrota
                          : styles.resultadoEmpate
                    }`}
                  >
                    {partida.resultado === 'vitoria'
                      ? 'Vitória'
                      : partida.resultado === 'derrota'
                        ? 'Derrota'
                        : 'Empate'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.semHistorico}>
              Nenhuma partida finalizada encontrada.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

function traduzirModo(modo: string): string {
  const mapa: Record<string, string> = {
    classico: 'Clássico',
    dificil: 'Difícil',
    relampago: 'Relâmpago',
    invisivel: 'Invisível',
    caos: 'Caos',
    sobrevivencia: 'Sobrevivência',
    partida_contra_ia: 'vs IA',
  }
  return mapa[modo] ?? modo
}
