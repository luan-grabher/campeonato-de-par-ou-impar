'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trophy } from 'lucide-react'
import Link from 'next/link'
import Botao from '@/componentes/ui/Botao'
import { criarCampeonato } from '@/servidor/acoes/criarCampeonato'
import styles from './criar.module.css'

const OPCES_DE_JOGADORES = [8, 16, 32, 64] as const

export default function PaginaCriarCampeonato() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [totalDeJogadores, setTotalDeJogadores] = useState<8 | 16 | 32 | 64>(16)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregando(true)
    setErro(null)

    const resultado = await criarCampeonato({
      nome: nome.trim(),
      totalDeJogadores,
    })

    if (resultado.status === 'sucesso') {
      router.push(`/campeonatos/${resultado.id}`)
    } else {
      setErro(resultado.mensagem)
      setCarregando(false)
    }
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <Link href="/campeonatos" className={styles.voltar}>
          <ArrowLeft size={16} />
          Voltar para campeonatos
        </Link>

        <div className={styles.card}>
          <div className={styles.cardCabecalho}>
            <Trophy className={styles.cardIcone} size={32} />
            <h1 className={styles.cardTitulo}>Criar Campeonato</h1>
            <p className={styles.cardDescricao}>
              Crie um campeonato mata-mata para os jogadores disputarem o título!
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.formulario}>
            {erro && (
              <div className={styles.erro}>
                <p>{erro}</p>
              </div>
            )}

            <div className={styles.campo}>
              <label htmlFor="nome" className={styles.label}>
                Nome do Campeonato
              </label>
              <input
                id="nome"
                type="text"
                className={styles.input}
                placeholder="Ex: Campeonato de Verão 2025"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={100}
                required
                disabled={carregando}
              />
            </div>

            <div className={styles.campo}>
              <label className={styles.label}>Número de Jogadores</label>
              <div className={styles.opcoes}>
                {OPCES_DE_JOGADORES.map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`${styles.opcao} ${totalDeJogadores === num ? styles.opcaoAtiva : ''}`}
                    onClick={() => setTotalDeJogadores(num)}
                    disabled={carregando}
                  >
                    <span className={styles.opcaoNumero}>{num}</span>
                    <span className={styles.opcaoRotulo}>jogadores</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.info}>
              <p>Formato: <strong>Mata-mata</strong></p>
              <p>Partidas: <strong>Melhor de 3</strong> (final: melhor de 5)</p>
              <p>Fases: <strong>{Math.log2(totalDeJogadores)} fases</strong></p>
            </div>

            <Botao
              type="submit"
              larguraTotal
              carregando={carregando}
              disabled={!nome.trim()}
            >
              Criar Campeonato
            </Botao>
          </form>
        </div>
      </div>
    </div>
  )
}
