'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { ShoppingCart, Check, Loader2, Store } from 'lucide-react'
import type { Cosmetico } from '@/supabase/tipos.gen'
import { chamarApi } from '@/hooks/usarApiCliente'
import { TIPO_DO_COSMETICO } from '@/supabase/tipos.gen'
import styles from './LojaDeCosmeticos.module.css'

interface CosmeticoDisponivel extends Cosmetico {
  jaPossui: boolean
}

interface Props {
  cosmeticos: CosmeticoDisponivel[]
  moedas: number
  onCompraRealizada?: () => void
}

const rotuloDoTipo: Record<string, string> = {
  [TIPO_DO_COSMETICO.AVATAR]: 'Avatares',
  [TIPO_DO_COSMETICO.MOLDURA]: 'Molduras',
  [TIPO_DO_COSMETICO.EFEITO_DE_VITORIA]: 'Efeitos de Vitória',
  [TIPO_DO_COSMETICO.TITULO]: 'Títulos',
  [TIPO_DO_COSMETICO.COR_DESTAQUE]: 'Cores de Destaque',
}

function agruparPorTipo(
  cosmeticos: CosmeticoDisponivel[]
): [string, CosmeticoDisponivel[]][] {
  const grupos = new Map<string, CosmeticoDisponivel[]>()
  for (const c of cosmeticos) {
    const lista = grupos.get(c.tipo) ?? []
    lista.push(c)
    grupos.set(c.tipo, lista)
  }
  return Array.from(grupos.entries())
}

export default function LojaDeCosmeticos({
  cosmeticos,
  moedas,
  onCompraRealizada,
}: Props) {
  const [comprando, setComprando] = useState<Set<string>>(new Set())
  const [mensagem, setMensagem] = useState<{
    tipo: 'sucesso' | 'erro'
    texto: string
  } | null>(null)

  const handleComprar = useCallback(
    async (id: string, preco: number) => {
      if (moedas < preco) {
        setMensagem({ tipo: 'erro', texto: 'Moedas insuficientes!' })
        return
      }

      setComprando((prev) => new Set(prev).add(id))
      setMensagem(null)

      const resultado = await chamarApi<{ sucesso: boolean; erro?: string; moedasRestantes?: number }>('/api/loja', { acao: 'comprar-cosmetico', idDoCosmetico: id })

      setComprando((prev) => {
        const novo = new Set(prev)
        novo.delete(id)
        return novo
      })

      if (resultado.sucesso) {
        setMensagem({ tipo: 'sucesso', texto: 'Cosmético adquirido com sucesso!' })
        onCompraRealizada?.()
      } else {
        setMensagem({
          tipo: 'erro',
          texto: resultado.erro ?? 'Erro ao comprar cosmético.',
        })
      }
    },
    [moedas, onCompraRealizada]
  )

  const grupos = agruparPorTipo(cosmeticos)

  if (cosmeticos.length === 0) {
    return (
      <div className={styles.vazio}>
        <Store size={48} />
        <p>Nenhum cosmético disponível no momento.</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {mensagem && (
        <div
          className={`${styles.mensagem} ${
            mensagem.tipo === 'sucesso' ? styles.mensagemSucesso : styles.mensagemErro
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <div className={styles.saldo}>
        <span className={styles.rotuloSaldo}>Suas moedas:</span>
        <span className={styles.valorSaldo}>{moedas}</span>
      </div>

      {grupos.map(([tipo, items]) => (
        <section key={tipo} className={styles.secao}>
          <h3 className={styles.tituloSecao}>
            {rotuloDoTipo[tipo] ?? tipo}
          </h3>
          <div className={styles.grid}>
            {items.map((cosmetico) => {
              const estaComprando = comprando.has(cosmetico.id)
              return (
                <div
                  key={cosmetico.id}
                  className={`${styles.cartao} ${
                    cosmetico.jaPossui ? styles.possui : ''
                  }`}
                >
                  <div className={styles.visual}>
                    {cosmetico.url_do_asset ? (
                      <Image
                        src={cosmetico.url_do_asset}
                        alt={cosmetico.nome}
                        width={80}
                        height={80}
                        className={styles.imagem}
                      />
                    ) : (
                      <div className={styles.placeholder}>
                        {cosmetico.nome.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className={styles.info}>
                    <h4 className={styles.nome}>{cosmetico.nome}</h4>
                    <span className={styles.tipo}>
                      {rotuloDoTipo[cosmetico.tipo] ?? cosmetico.tipo}
                    </span>
                  </div>

                  <div className={styles.rodape}>
                    {cosmetico.jaPossui ? (
                      <span className={styles.botaoPossui}>
                        <Check size={16} /> Adquirido
                      </span>
                    ) : (
                      <button
                        type="button"
                        className={styles.botaoComprar}
                        disabled={estaComprando || moedas < cosmetico.preco_em_moedas}
                        onClick={() =>
                          handleComprar(
                            cosmetico.id,
                            cosmetico.preco_em_moedas
                          )
                        }
                      >
                        {estaComprando ? (
                          <Loader2 size={16} className={styles.spinner} />
                        ) : (
                          <ShoppingCart size={16} />
                        )}
                        <span>{cosmetico.preco_em_moedas}</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
