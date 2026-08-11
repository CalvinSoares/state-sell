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
import { jardinagem } from "./jardinagem";
import { transporte } from "./transporte";
import { veterinaria } from "./veterinaria";
import { materialEscritorio } from "./material-escritorio";
import { mobiliario } from "./mobiliario";
import { costura } from "./costura";

export const RAMOS: readonly Ramo[] = [
  alimentacao,
  informatica,
  grafica,
  limpeza,
  manutencaoPredial,
  jardinagem,
  transporte,
  veterinaria,
  materialEscritorio,
  mobiliario,
  costura,
] as const;

export const RAMOS_POR_SLUG: ReadonlyMap<string, Ramo> = new Map(
  RAMOS.map((r) => [r.slug, r]),
);

export function ramoPorSlug(slug: string): Ramo | undefined {
  return RAMOS_POR_SLUG.get(slug);
}
