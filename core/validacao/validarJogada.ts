import type { IntervaloDeNumeros } from '../constantes/intervalosDeNumeros'

interface ParametrosDeValidacao {
  numeroEscolhido: number
  intervalo: IntervaloDeNumeros
  modo: string
}

interface ResultadoDeValidacao {
  valida: boolean
  erro?: string
}

export function validarJogada(
  parametros: ParametrosDeValidacao
): ResultadoDeValidacao {
  const { numeroEscolhido, intervalo, modo } = parametros

  if (!Number.isInteger(numeroEscolhido)) {
    return { valida: false, erro: 'O número precisa ser um inteiro.' }
  }

  if (numeroEscolhido < intervalo.minimo || numeroEscolhido > intervalo.maximo) {
    return {
      valida: false,
      erro: `O número precisa estar entre ${intervalo.minimo} e ${intervalo.maximo}.`,
    }
  }

  if (modo === 'relampago' && (numeroEscolhido < 1 || numeroEscolhido > 2)) {
    return {
      valida: false,
      erro: 'No modo Relâmpago, escolha apenas 1 ou 2.',
    }
  }

  if (modo === 'classico' && (numeroEscolhido < 1 || numeroEscolhido > 2)) {
    return {
      valida: false,
      erro: 'No modo Clássico, escolha apenas 1 ou 2.',
    }
  }

  // Modo Invisível: validar contra o intervalo definido nas regras
  if (modo === 'invisivel' && (numeroEscolhido < 1 || numeroEscolhido > 10)) {
    return {
      valida: false,
      erro: 'No modo Invisível, escolha um número entre 1 e 10.',
    }
  }

  // Modo Caos: a validação é feita contra o intervalo gerado deterministicamente
  // O servidor gera o intervalo e valida; aqui apenas garantimos valor positivo
  if (modo === 'caos' && numeroEscolhido < 0) {
    return {
      valida: false,
      erro: 'No modo Caos, escolha um número não negativo.',
    }
  }

  return { valida: true }
}
