import "server-only";
import { and, eq, gt, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/src/server/db";
import { classificacaoItem, contratacao, itemContratacao } from "@/src/server/db/schema";
import { LIMIAR } from "@/src/server/casamento/casar";

export type PerfilPrevia = {
  ramos: string[];
  municipiosIbge: string[];
  uf: string | null;
  tetoValorCentavos: bigint | null;
};

export type OportunidadePrevia = {
  orgaoRazaoSocial: string;
  municipioNome: string;
  ramoSlug: string;
  itemDescricao: string;
  valorTotalEstimadoCentavos: bigint | null;
  dataEncerramentoProposta: Date | null;
  exclusivoMeEpp: boolean;
};

/**
 * Oportunidades ABERTAS que já batem com o perfil — para a prévia do cadastro
 * ("o que você teria recebido"). Usa os índices de contratação. Só leitura.
 * Uma por contratação (dedup em memória).
 */
export async function previaOportunidades(
  p: PerfilPrevia,
  agora: Date,
  versaoCatalogo: number,
  limite = 12,
): Promise<OportunidadePrevia[]> {
  if (p.ramos.length === 0) return [];

  const geo =
    p.municipiosIbge.length > 0
      ? inArray(contratacao.codigoIbge, p.municipiosIbge)
      : p.uf
        ? eq(contratacao.uf, p.uf)
        : sql`false`;

  const teto =
    p.tetoValorCentavos == null
      ? undefined
      : or(
          isNull(contratacao.valorTotalEstimadoCentavos),
          lte(contratacao.valorTotalEstimadoCentavos, p.tetoValorCentavos),
        );

  const linhas = await db
    .select({
      contratacaoId: contratacao.id,
      orgao: contratacao.orgaoRazaoSocial,
      municipio: contratacao.municipioNome,
      valor: contratacao.valorTotalEstimadoCentavos,
      prazo: contratacao.dataEncerramentoProposta,
      ramo: classificacaoItem.ramoSlug,
      item: itemContratacao.descricao,
      beneficio: itemContratacao.tipoBeneficioNome,
    })
    .from(contratacao)
    .innerJoin(itemContratacao, eq(itemContratacao.contratacaoId, contratacao.id))
    .innerJoin(
      classificacaoItem,
      and(
        eq(classificacaoItem.itemId, itemContratacao.id),
        eq(classificacaoItem.versaoCatalogo, versaoCatalogo),
      ),
    )
    .where(
      and(
        eq(contratacao.situacaoCompraId, 1),
        gt(contratacao.dataEncerramentoProposta, agora),
        inArray(classificacaoItem.ramoSlug, p.ramos),
        sql`${classificacaoItem.score}::numeric >= ${LIMIAR}`,
        geo,
        ...(teto ? [teto] : []),
      ),
    )
    .orderBy(contratacao.dataEncerramentoProposta)
    .limit(limite * 5);

  // Dedup por contratação (uma linha por item casado).
  const vistas = new Set<string>();
  const ops: OportunidadePrevia[] = [];
  for (const l of linhas) {
    if (vistas.has(l.contratacaoId)) continue;
    vistas.add(l.contratacaoId);
    ops.push({
      orgaoRazaoSocial: l.orgao,
      municipioNome: l.municipio,
      ramoSlug: l.ramo,
      itemDescricao: l.item,
      valorTotalEstimadoCentavos: l.valor,
      dataEncerramentoProposta: l.prazo,
      exclusivoMeEpp: (l.beneficio ?? "").toLowerCase().includes("exclusiv"),
    });
    if (ops.length >= limite) break;
  }
  return ops;
}
