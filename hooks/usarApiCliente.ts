'use client'

/**
 * Hook/função para chamar APIs internas do Next.js (API Routes).
 * Substitui chamadas diretas a Server Actions do lado do cliente.
 *
 * @param url - Caminho da API (ex: '/api/fila-de-partida')
 * @param corpo - Corpo da requisição (opcional)
 * @returns Resposta JSON parseada
 */
export async function chamarApi<TSaida = any>(
  url: string,
  corpo?: Record<string, unknown>
): Promise<TSaida> {
  const resposta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })

  const dados = await resposta.json()

  if (!resposta.ok) {
    const mensagem = dados?.erro ?? dados?.mensagem ?? 'Erro inesperado ao comunicar com o servidor.'
    throw new Error(mensagem)
  }

  return dados as TSaida
}
