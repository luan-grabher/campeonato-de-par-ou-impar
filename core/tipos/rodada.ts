export interface DadosDaRodada {
  id: string
  idDaPartida: string
  numeroDaRodada: number
  numeroDoPrimeiroJogador: number | null
  paridadeEscolhidaPeloPrimeiro: 'par' | 'impar' | null
  jogadaDoPrimeiroConfirmada: boolean
  numeroDoSegundoJogador: number | null
  paridadeEscolhidaPeloSegundo: 'par' | 'impar' | null
  jogadaDoSegundoConfirmada: boolean
  resultadoCalculado: boolean
  vencedorId: string | null
  somaDosNumeros: number | null
  paridadeResultante: 'par' | 'impar' | null
}

export interface ResultadoDaRodada {
  somaDosNumeros: number
  paridadeResultante: 'par' | 'impar'
  primeiroJogadorVenceu: boolean
}
