'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import InputTexto from '@/componentes/ui/InputTexto'
import Botao from '@/componentes/ui/Botao'
import { chamarApi } from '@/hooks/usarApiCliente'
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
    const nomeFinal = nomeNormalizado || 'Jogador'

    if (nomeNormalizado.length > 20) {
      setErro('Nome muito longo. Use no máximo 20 caracteres.')
      return
    }

    setCarregando(true)

    try {
      const resultado = await chamarApi('/api/partida-contra-ia/iniciar', {})

      router.push(
        `/partida-rapida-ia/jogo?id=${resultado.idDaPartida}`
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
        label="Seu nome (opcional)"
        placeholder="Digite seu nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        maxLength={20}
        erro={erro ?? undefined}
        disabled={carregando}
      />

      <div className={styles.infoRodadas}>
        🎯 Melhor de <strong>3</strong> rodadas — escolha entre <strong>1</strong> ou <strong>2</strong>
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
