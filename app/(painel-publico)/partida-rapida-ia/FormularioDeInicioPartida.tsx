'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import InputTexto from '@/componentes/ui/InputTexto'
import Botao from '@/componentes/ui/Botao'
import styles from './partida-rapida-ia.module.css'

export default function FormularioDeInicioPartida() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    const nomeNormalizado = nome.trim()
    if (!nomeNormalizado) {
      setErro('Digite seu nome para começar.')
      return
    }

    if (nomeNormalizado.length > 20) {
      setErro('Nome muito longo. Use no máximo 20 caracteres.')
      return
    }

    setCarregando(true)

    try {
      const { iniciarPartidaContraIa } = await import(
        '@/servidor/acoes/iniciarPartidaContraIa'
      )

      const resultado = await iniciarPartidaContraIa(nomeNormalizado)

      router.push(
        `/partida-rapida-ia/jogo?id=${resultado.idDaPartida}&nome=${encodeURIComponent(nomeNormalizado)}`
      )
    } catch (err) {
      const mensagem =
        err instanceof Error ? err.message : 'Erro ao iniciar partida.'
      setErro(mensagem)
      setCarregando(false)
    }
  }

  return (
    <form className={styles.formulario} onSubmit={handleSubmit}>
      <InputTexto
        label="Seu nome"
        placeholder="Digite seu nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        maxLength={20}
        erro={erro ?? undefined}
        disabled={carregando}
        required
      />

      <div className={styles.infoRodadas}>
        🎯 Melhor de <strong>3</strong> rodadas — números de <strong>0 a 10</strong>
      </div>

      <Botao
        type="submit"
        variante="primario"
        tamanho="grande"
        larguraTotal
        carregando={carregando}
        disabled={carregando}
      >
        Começar Partida
      </Botao>
    </form>
  )
}
