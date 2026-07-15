'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { atualizarPerfil } from '@/servidor/acoes/atualizarPerfil'
import Botao from '@/componentes/ui/Botao'
import InputTexto from '@/componentes/ui/InputTexto'
import styles from './page.module.css'

export default function PaginaEditarPerfil() {
  const router = useRouter()
  const [estado, acao, pendente] = useActionState(atualizarPerfil, null)

  if (estado?.sucesso) {
    return (
      <div className={styles.pagina}>
        <div className={styles.container}>
          <div className={styles.sucesso}>
            <span className={styles.iconeSucesso}>✓</span>
            <h2 className={styles.tituloSucesso}>Perfil atualizado!</h2>
            <p className={styles.descricaoSucesso}>
              Suas informações foram salvas com sucesso.
            </p>
            <Link href="/perfil" className={styles.botaoVoltar}>
              Voltar ao Perfil
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <div className={styles.cabecalho}>
          <Link href="/perfil" className={styles.linkVoltar}>
            ← Voltar
          </Link>
          <h1 className={styles.titulo}>Editar Perfil</h1>
        </div>

        <form action={acao} className={styles.formulario}>
          {estado?.erro && (
            <div className={styles.erroGlobal} role="alert">
              {estado.erro}
            </div>
          )}

          <InputTexto
            label="Nome"
            name="nome"
            placeholder="Seu nome de jogador"
            maxLength={24}
            minLength={2}
            required
          />

          <InputTexto
            label="País (código ISO 2 letras)"
            name="pais"
            placeholder="Ex: BR, US, JP"
            maxLength={2}
            pattern="^[A-Za-z]{2}$"
          />

          <InputTexto
            label="URL do Avatar"
            name="urlDoAvatar"
            placeholder="https://exemplo.com/avatar.png"
            type="url"
          />

          <div className={styles.acoes}>
            <Botao
              type="submit"
              variante="primario"
              carregando={pendente}
              larguraTotal
            >
              Salvar Alterações
            </Botao>
          </div>
        </form>
      </div>
    </div>
  )
}
