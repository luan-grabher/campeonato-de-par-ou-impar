import { gerarJogadaAleatoria } from '@/core/calculo/jogadaDaIaAleatoria'
import { gerarJogadaTeimosa } from '@/core/calculo/jogadaDaIaTeimosa'
import { gerarJogadaPsicologica } from '@/core/calculo/jogadaDaIaPsicologica'
import { gerarJogadaCaucaotica } from '@/core/calculo/jogadaDaIaCaucaotica'

export type PersonalidadeDaIa = 'aleatoria' | 'teimosa' | 'psicologica' | 'caotica'

export interface JogadaDaIa {
  numero: number
  paridade: 'par' | 'impar'
}

export interface DadosParaJogadaDaIa {
  idDaPartida: string
  rodadaAtual: number
  historicoDoOponente: Array<{ numero: number; paridade: string }>
  intervalo: { minimo: number; maximo: number }
}

export async function executarJogadaDaIa(
  personalidade: PersonalidadeDaIa,
  dados: DadosParaJogadaDaIa
): Promise<JogadaDaIa> {
  switch (personalidade) {
    case 'aleatoria':
      return gerarJogadaAleatoria(dados.intervalo)

    case 'teimosa':
      return gerarJogadaTeimosa(dados.intervalo)

    case 'psicologica':
      return gerarJogadaPsicologica(dados.intervalo, dados.historicoDoOponente)

    case 'caotica':
      return gerarJogadaCaucaotica(dados.intervalo)
  }
}
