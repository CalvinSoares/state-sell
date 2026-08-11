import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/src/server/db";
import { classificacaoItem, contratacao, itemContratacao } from "@/src/server/db/schema";

export type ItemParaClassificar = {
  itemId: string;
  descricao: string;
  unidadeMedida: string | null;
  objetoCompra: string;
  informacaoComplementar: string | null;
};

/**
 * Itens sem classificação na versão atual do catálogo. O LEFT JOIN por
 * versaoCatalogo garante reprocessamento automático quando o catálogo muda.
 */
export async function itensSemClassificacao(
  versaoCatalogo: number,
  limite: number,
): Promise<ItemParaClassificar[]> {
  const linhas = await db
    .select({
      itemId: itemContratacao.id,
      descricao: itemContratacao.descricao,
      unidadeMedida: itemContratacao.unidadeMedida,
      objetoCompra: contratacao.objetoCompra,
      informacaoComplementar: contratacao.informacaoComplementar,
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
    .where(sql`${classificacaoItem.id} is null`)
    .limit(limite);

  return linhas;
}

export type ClassificacaoNova = {
  itemId: string;
  ramoSlug: string;
  score: string;
  termosCasados: string[];
  escala: boolean;
};

/** Grava classificações. Idempotente pela UNIQUE (item, ramo, versão). */
export async function gravarClassificacoes(
  versaoCatalogo: number,
  classificacoes: ClassificacaoNova[],
): Promise<void> {
  if (classificacoes.length === 0) return;
  await db
    .insert(classificacaoItem)
    .values(
      classificacoes.map((c) => ({
        itemId: c.itemId,
        ramoSlug: c.ramoSlug,
        score: c.score,
        termosCasados: c.termosCasados,
        escala: c.escala ? "sim" : null,
        versaoCatalogo,
      })),
    )
    .onConflictDoNothing({
      target: [classificacaoItem.itemId, classificacaoItem.ramoSlug, classificacaoItem.versaoCatalogo],
    });
}
