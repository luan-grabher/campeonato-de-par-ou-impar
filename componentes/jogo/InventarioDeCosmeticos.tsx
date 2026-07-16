'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Check, X, Loader2, Package } from 'lucide-react'
import type { Cosmetico } from '@/supabase/tipos.gen'
import { chamarApi } from '@/hooks/usarApiCliente'
import { TIPO_DO_COSMETICO } from '@/supabase/tipos.gen'
import styles from './InventarioDeCosmeticos.module.css'

interface CosmeticoNoInventario extends Cosmetico {
  equipado: boolean
  adquiridoEm: string
}

interface Props {
  cosmeticos: CosmeticoNoInventario[]
  onEquipamentoAlterado?: () => void
}

const rotuloDoTipo: Record<string, string> = {
  [TIPO_DO_COSMETICO.AVATAR]: 'Avatares',
  [TIPO_DO_COSMETICO.MOLDURA]: 'Molduras',
  [TIPO_DO_COSMETICO.EFEITO_DE_VITORIA]: 'Efeitos de Vitória',
  [TIPO_DO_COSMETICO.TITULO]: 'Títulos',
  [TIPO_DO_COSMETICO.COR_DESTAQUE]: 'Cores de Destaque',
}

function agruparPorTipo(
  cosmeticos: CosmeticoNoInventario[]
): [string, CosmeticoNoInventario[]][] {
  const grupos = new Map<string, CosmeticoNoInventario[]>()
  for (const c of cosmeticos) {
    const lista = grupos.get(c.tipo) ?? []
    lista.push(c)
    grupos.set(c.tipo, lista)
  }
  return Array.from(grupos.entries())
}

export default function InventarioDeCosmeticos({
  cosmeticos,
  onEquipamentoAlterado,
}: Props) {
  const [alterando, setAlterando] = useState<Set<string>>(new Set())
  const [mensagem, setMensagem] = useState<{
    tipo: 'sucesso' | 'erro'
    texto: string
  } | null>(null)

  const handleEquipar = useCallback(
    async (id: string, equipado: boolean) => {
      setAlterando((prev) => new Set(prev).add(id))
      setMensagem(null)

      const resultado = await chamarApi<{ sucesso: boolean; erro?: string }>('/api/loja', { acao: 'equipar-cosmetico', idDoCosmetico: id })

      setAlterando((prev) => {
        const novo = new Set(prev)
        novo.delete(id)
        return novo
      })

      if (resultado.sucesso) {
        const acao = equipado ? 'desequipado' : 'equipado'
        setMensagem({ tipo: 'sucesso', texto: `Cosmético ${acao} com sucesso!` })
        onEquipamentoAlterado?.()
      } else {
        setMensagem({
          tipo: 'erro',
          texto: resultado.erro ?? 'Erro ao alterar equipamento.',
        })
      }
    },
    [onEquipamentoAlterado]
  )

  const grupos = agruparPorTipo(cosmeticos)

  if (cosmeticos.length === 0) {
    return (
      <div className={styles.vazio}>
        <Package size={48} />
        <p>Seu inventário está vazio.</p>
        <p className={styles.dica}>
          Visite a loja para adquirir cosméticos!
        </p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {mensagem && (
        <div
          className={`${styles.mensagem} ${
            mensagem.tipo === 'sucesso'
              ? styles.mensagemSucesso
              : styles.mensagemErro
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      {grupos.map(([tipo, items]) => (
        <section key={tipo} className={styles.secao}>
          <h3 className={styles.tituloSecao}>
            {rotuloDoTipo[tipo] ?? tipo}
            <span className={styles.contagem}>{items.length}</span>
          </h3>
          <div className={styles.grid}>
            {items.map((cosmetico) => {
              const estaAlterando = alterando.has(cosmetico.id)
              return (
                <div
                  key={cosmetico.id}
                  className={`${styles.cartao} ${
                    cosmetico.equipado ? styles.equipado : ''
                  }`}
                >
                  {cosmetico.equipado && (
                    <span className={styles.seloEquipado}>
                      <Check size={12} /> Equipado
                    </span>
                  )}

                  <div className={styles.visual}>
                    {cosmetico.url_do_asset ? (
                      <Image
                        src={cosmetico.url_do_asset}
                        alt={cosmetico.nome}
                        width={64}
                        height={64}
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

                  <button
                    type="button"
                    className={`${styles.botaoAlternar} ${
                      cosmetico.equipado ? styles.botaoDesequipar : styles.botaoEquipar
                    }`}
                    disabled={estaAlterando}
                    onClick={() => handleEquipar(cosmetico.id, cosmetico.equipado)}
                  >
                    {estaAlterando ? (
                      <Loader2 size={14} className={styles.spinner} />
                    ) : cosmetico.equipado ? (
                      <>
                        <X size={14} /> Desequipar
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Equipar
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
