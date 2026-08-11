import "server-only";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/src/server/db";
import {
  alerta,
  classificacaoItem,
  contratacao,
  feedbackAlerta,
  itemContratacao,
  rotuloManual,
} from "@/src/server/db/schema";
import { RAMO_SEM_CLASSIFICACAO } from "@/src/server/coleta/casar.job";
import { hashTexto } from "@/src/server/rotulagem/hash";
import type { Candidato } from "@/src/server/rotulagem/fila";

/**
 * Candidatos para rotular: itens cujo hash de texto ainda não foi rotulado.
 * Traz score/ramo da classificação atual e marca quem tem feedback negativo.
 * A priorização fina é feita em memória por montarFila (puro, testado).
 */
export async function candidatosParaRotular(
  versaoCatalogo: number,
  poolLimite: number,
): Promise<Candidato[]> {
  const jaRotulados = db.select({ h: rotuloManual.hashTexto }).from(rotuloManual);

  const linhas = await db
    .select({
      itemId: itemContratacao.id,
      descricaoItem: itemContratacao.descricao,
      unidadeMedida: itemContratacao.unidadeMedida,
      objetoCompra: contratacao.objetoCompra,
      municipioNome: contratacao.municipioNome,
      score: classificacaoItem.score,
      ramoSlug: classificacaoItem.ramoSlug,
    })
    .from(itemContratacao)
    .innerJoin(contratacao, eq(itemContratacao.contratacaoId, contratacao.id))
    .leftJoin(
      classificacaoItem,
      and(
        eq(classificacaoItem.itemId, itemContratacao.id),
        eq(classificacaoItem.versaoCatalogo, versaoCatalogo),
      ),
    )
    .limit(poolLimite);

  const rotuladosSet = new Set((await jaRotulados).map((r) => r.h));
  const comFeedback = await hashesComFeedbackNegativo();

  // Deduplica por hash em memória e monta o Candidato.
  const vistos = new Set<string>();
  const candidatos: Candidato[] = [];
  for (const l of linhas) {
    const h = hashTexto(l.descricaoItem, l.objetoCompra);
    if (rotuladosSet.has(h) || vistos.has(h)) continue;
    vistos.add(h);

    const ramoReal = l.ramoSlug && l.ramoSlug !== RAMO_SEM_CLASSIFICACAO ? l.ramoSlug : null;
    candidatos.push({
      hashTexto: h,
      itemId: l.itemId,
      descricaoItem: l.descricaoItem,
      objetoCompra: l.objetoCompra,
      unidadeMedida: l.unidadeMedida,
      municipioNome: l.municipioNome,
      score: l.score != null ? Number(l.score) : null,
      ramoSugerido: ramoReal,
      temFeedbackNegativo: comFeedback.has(h),
    });
  }
  return candidatos;
}

/** Hashes de texto de itens que geraram feedback negativo de assinante. */
async function hashesComFeedbackNegativo(): Promise<Set<string>> {
  const linhas = await db
    .select({
      descricao: itemContratacao.descricao,
      objeto: contratacao.objetoCompra,
    })
    .from(feedbackAlerta)
    .innerJoin(alerta, eq(alerta.id, feedbackAlerta.alertaId))
    .innerJoin(itemContratacao, eq(itemContratacao.id, alerta.itemIdPrincipal))
    .innerJoin(contratacao, eq(contratacao.id, alerta.contratacaoId))
    .where(eq(feedbackAlerta.util, false));

  return new Set(linhas.map((l) => hashTexto(l.descricao, l.objeto)));
}

export type SalvarRotuloInput = {
  descricaoItem: string;
  objetoCompra: string;
  ramoEsperado: string | null;
  origemAmostra: string;
  viuPalpite: boolean;
  nota?: string;
  rotuladoPor: string;
};

/** Salva (ou atualiza) o rótulo. Chave por hash de texto. */
export async function salvarRotulo(input: SalvarRotuloInput): Promise<void> {
  const h = hashTexto(input.descricaoItem, input.objetoCompra);
  await db
    .insert(rotuloManual)
    .values({
      hashTexto: h,
      descricaoItem: input.descricaoItem,
      objetoCompra: input.objetoCompra,
      ramoEsperado: input.ramoEsperado,
      origemAmostra: input.origemAmostra,
      viuPalpite: input.viuPalpite,
      nota: input.nota,
      rotuladoPor: input.rotuladoPor,
    })
    .onConflictDoUpdate({
      target: rotuloManual.hashTexto,
      set: {
        ramoEsperado: input.ramoEsperado,
        origemAmostra: input.origemAmostra,
        viuPalpite: input.viuPalpite,
        nota: input.nota,
        rotuladoPor: input.rotuladoPor,
        rotuladoEm: new Date(),
      },
    });
}

/** Progresso por ramo: quantos rótulos existem (meta ~200). */
export async function progressoRotulagem(): Promise<{ ramo: string; total: number }[]> {
  const linhas = await db
    .select({ ramo: rotuloManual.ramoEsperado, total: count() })
    .from(rotuloManual)
    .groupBy(rotuloManual.ramoEsperado);
  return linhas.map((l) => ({ ramo: l.ramo ?? "(nenhum)", total: l.total }));
}

/** Todos os rótulos, para o script rotulos:sync. */
export async function listarRotulos() {
  return db.select().from(rotuloManual).orderBy(rotuloManual.ramoEsperado, rotuloManual.rotuladoEm);
}
