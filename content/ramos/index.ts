/**
 * Registro tipado de todos os ramos do catálogo.
 * Ver docs/base-de-conhecimentos/regras-de-negocio/catalogo-de-ramos.md
 */
import type { Ramo } from "@/src/shared/types/ramo";
import { alimentacao } from "./alimentacao";
import { grafica } from "./grafica";
import { informatica } from "./informatica";
import { limpeza } from "./limpeza";
import { manutencaoPredial } from "./manutencao-predial";

export const RAMOS: readonly Ramo[] = [
  alimentacao,
  informatica,
  grafica,
  limpeza,
  manutencaoPredial,
] as const;

export const RAMOS_POR_SLUG: ReadonlyMap<string, Ramo> = new Map(
  RAMOS.map((r) => [r.slug, r]),
);

export function ramoPorSlug(slug: string): Ramo | undefined {
  return RAMOS_POR_SLUG.get(slug);
}
