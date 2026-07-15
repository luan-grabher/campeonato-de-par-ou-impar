'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Copy } from 'lucide-react'
import ModalDeCriacaoDeSala from '@/componentes/ui/ModalDeCriacaoDeSala'
import Botao from '@/componentes/ui/Botao'
import { criarSalaPrivada } from '@/servidor/acoes/criarSalaPrivada'
import { usarJogadorAutenticado } from '@/hooks/usarJogadorAutenticado'
import styles from './criar.module.css'

export default function PaginaCriarSala() {
  const router = useRouter()
  const { jogador, carregando: jogadorCarregando } = usarJogadorAutenticado()
  const [modalAberto, setModalAberto] = useState(true)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salaCriada, setSalaCriada] = useState<{ idDaSala: string; codigo: string } | null>(null)
  const [copiado, setCopiado] = useState(false)

  const lidarCriar = useCallback(async (dados: {
    titulo: string
    totalDeRodadas: 3 | 5 | 7
    modoDeJogo: string
  }) => {
    setCarregando(true)
    setErro(null)

    const resultado = await criarSalaPrivada({
      titulo: dados.titulo,
      totalDeRodadas: dados.totalDeRodadas,
      modoDeJogo: dados.modoDeJogo as any,
    })

    setCarregando(false)

    if (resultado.status === 'erro') {
      setErro(resultado.mensagem)
      return
    }

    setSalaCriada({ idDaSala: resultado.idDaSala, codigo: resultado.codigo })
  }, [])

  const lidarFecharModal = useCallback(() => {
    if (salaCriada) return // Não deixa fechar se já criou
    router.push('/salas-privadas')
  }, [router, salaCriada])

  const lidarIrParaSala = useCallback(() => {
    if (!salaCriada) return
    router.push(`/salas-privadas/${salaCriada.codigo}`)
  }, [router, salaCriada])

  const lidarCopiar = useCallback(async () => {
    if (!salaCriada) return
    const link = `${window.location.origin}/salas-privadas/${salaCriada.codigo}`

    try {
      await navigator.clipboard.writeText(link)
    } catch {
      const input = document.createElement('input')
      input.value = link
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }

    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }, [salaCriada])

  if (!salaCriada) {
    return (
      <div className={styles.pagina}>
        <ModalDeCriacaoDeSala
          aberto={modalAberto}
          carregando={carregando}
          onFechar={lidarFecharModal}
          onCriar={lidarCriar}
        />

        {erro && (
          <div className={styles.erroContainer}>
            <p className={styles.erro}>{erro}</p>
          </div>
        )}
      </div>
    )
  }

  // Sala criada — mostrar sucesso
  const linkCompleto = typeof window !== 'undefined'
    ? `${window.location.origin}/salas-privadas/${salaCriada.codigo}`
    : ''

  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <div className={styles.cardSucesso}>
          <div className={styles.checkmark}>
            <Check size={48} />
          </div>

          <h1 className={styles.titulo}>Sala Criada! 🎉</h1>
          <p className={styles.descricao}>
            Sua sala foi criada com sucesso. Compartilhe o código com seu amigo!
          </p>

          <div className={styles.secaoCodigo}>
            <span className={styles.labelCodigo}>Código da Sala</span>
            <div className={styles.codigoContainer}>
              <span className={styles.codigo}>{salaCriada.codigo}</span>
            </div>
          </div>

          <div className={styles.secaoLink}>
            <span className={styles.labelLink}>Link compartilhável</span>
            <div className={styles.linkContainer}>
              <span className={styles.linkTexto}>{linkCompleto}</span>
              <button
                className={styles.botaoCopiar}
                onClick={lidarCopiar}
                title="Copiar link"
                aria-label="Copiar link"
              >
                {copiado ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.acoes}>
            <Botao
              variante="secundario"
              onClick={() => router.push('/salas-privadas')}
            >
              <ArrowLeft size={16} />
              Voltar
            </Botao>
            <Botao
              variante="primario"
              tamanho="grande"
              onClick={lidarIrParaSala}
            >
              Ir para a Sala
            </Botao>
          </div>
        </div>
      </div>
    </div>
  )
}
