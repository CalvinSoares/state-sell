/**
 * O coração técnico. FUNÇÃO PURA: sem I/O, sem Date, sem Math.random, sem env.
 * Enviesado para PRECISÃO — alerta errado faz a pessoa cancelar.
 *
 * Ver docs/base-de-conhecimentos/regras-de-negocio/casamento.md
 */

import type { Ramo } from "@/src/shared/types/ramo";
import { contemTermo, normalizar } from "./normalizar";

export type TextoDoItem = {
  descricaoItem: string;
  objetoCompra: string;
  informacaoComplementar?: string;
  unidadeMedida?: string;
};

export type Casamento = {
  ramo: string;
  score: number; // 0..1
  /** por que este alerta chegou — vai para o e-mail e para o backoffice */
  termosCasados: string[];
  escala: boolean;
};

/** Limiar de classificação. Calibrar com o conjunto rotulado. */
export const LIMIAR = 0.6;

/** Diferença mínima de score entre o 1º e o 2º ramo para não ser ambíguo. */
export const MARGEM_AMBIGUIDADE = 0.15;

const PESO = {
  forteDescricao: 0.6,
  forteObjeto: 0.4,
  comumDescricao: 0.25,
  comumObjeto: 0.15,
  unidade: 0.05,
} as const;

type Campos = {
  descricao: string;
  objeto: string;
  complementar: string;
  unidade: string;
};

function normalizarCampos(texto: TextoDoItem): Campos {
  return {
    descricao: normalizar(texto.descricaoItem),
    objeto: normalizar(texto.objetoCompra),
    complementar: normalizar(texto.informacaoComplementar ?? ""),
    unidade: normalizar(texto.unidadeMedida ?? ""),
  };
}

/** Veto é ABSOLUTO e não é ponderado. */
function temVeto(ramo: Ramo, campos: Campos): boolean {
  const alvo = `${campos.descricao} ${campos.objeto} ${campos.complementar}`;
  return ramo.excluir.some((t) => contemTermo(alvo, t));
}

function pontuar(ramo: Ramo, campos: Campos): { score: number; termos: string[] } {
  let score = 0;
  const termos: string[] = [];

  for (const termo of ramo.termosFortes) {
    if (contemTermo(campos.descricao, termo)) {
      score += PESO.forteDescricao;
      termos.push(termo);
    } else if (contemTermo(campos.objeto, termo)) {
      score += PESO.forteObjeto;
      termos.push(termo);
    }
  }

  for (const termo of ramo.termos) {
    if (contemTermo(campos.descricao, termo)) {
      score += PESO.comumDescricao;
      termos.push(termo);
    } else if (contemTermo(campos.objeto, termo)) {
      score += PESO.comumObjeto;
      termos.push(termo);
    }
  }

  if (ramo.unidadesEsperadas?.some((u) => campos.unidade !== "" && contemTermo(campos.unidade, u))) {
    score += PESO.unidade;
  }

  return { score: Math.min(1, score), termos };
}

function temEscala(ramo: Ramo, campos: Campos): boolean {
  const alvo = `${campos.descricao} ${campos.objeto} ${campos.complementar}`;
  return (ramo.alertaDeEscala ?? []).some((t) => contemTermo(alvo, t));
}

/**
 * Retorna os ramos que classificam este item, do maior score para o menor.
 * Aplica veto, limiar e regra de ambiguidade. Nunca retorna ramo vetado.
 */
export function casar(texto: TextoDoItem, ramos: readonly Ramo[]): Casamento[] {
  const campos = normalizarCampos(texto);

  const candidatos: Casamento[] = [];
  for (const ramo of ramos) {
    if (temVeto(ramo, campos)) continue;

    const { score, termos } = pontuar(ramo, campos);
    if (score < LIMIAR) continue;

    candidatos.push({
      ramo: ramo.slug,
      score,
      termosCasados: termos,
      escala: temEscala(ramo, campos),
    });
  }

  candidatos.sort((a, b) => b.score - a.score);

  // Ambiguidade: se dois ramos empatam dentro da margem, ninguém é classificado.
  // Item ambíguo vira trabalho de catálogo, não dois e-mails nem um chute.
  if (candidatos.length >= 2) {
    const [primeiro, segundo] = candidatos as [Casamento, Casamento];
    if (primeiro.score - segundo.score < MARGEM_AMBIGUIDADE) {
      return [];
    }
  }

  return candidatos;
}

/** Conveniência: o melhor ramo, ou null se nenhum classifica. */
export function melhorRamo(texto: TextoDoItem, ramos: readonly Ramo[]): Casamento | null {
  return casar(texto, ramos)[0] ?? null;
}
