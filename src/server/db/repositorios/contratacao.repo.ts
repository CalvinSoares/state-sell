import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/src/server/db";
import { contratacao, itemContratacao } from "@/src/server/db/schema";
import type { ContratacaoInterna, ItemInterno } from "@/src/server/pncp/mapeadores";

/**
 * Upsert por numero_controle_pncp. Rodar duas vezes não pode duplicar.
 * Retorna { novaContratacaoId } quando a contratação era nova (para decidir se
 * vale buscar itens — o N+1 só se paga em contratação nova).
 */
export async function upsertContratacao(
  c: ContratacaoInterna,
): Promise<{ id: string; nova: boolean }> {
  const [linha] = await db
    .insert(contratacao)
    .values({
      numeroControlePncp: c.numeroControlePncp,
      cnpjOrgao: c.cnpjOrgao,
      orgaoRazaoSocial: c.orgaoRazaoSocial,
      ano: c.ano,
      sequencial: c.sequencial,
      objetoCompra: c.objetoCompra,
      informacaoComplementar: c.informacaoComplementar,
      valorTotalEstimadoCentavos: c.valorTotalEstimadoCentavos,
      uf: c.uf,
      codigoIbge: c.codigoIbge,
      municipioNome: c.municipioNome,
      unidadeNome: c.unidadeNome,
      modalidadeId: c.modalidadeId,
      situacaoCompraId: c.situacaoCompraId,
      dataPublicacaoPncp: c.dataPublicacaoPncp,
      dataAberturaProposta: c.dataAberturaProposta,
      dataEncerramentoProposta: c.dataEncerramentoProposta,
      linkSistemaOrigem: c.linkSistemaOrigem,
      bruto: c.bruto,
    })
    .onConflictDoUpdate({
      target: contratacao.numeroControlePncp,
      set: {
        situacaoCompraId: c.situacaoCompraId,
        dataEncerramentoProposta: c.dataEncerramentoProposta,
        valorTotalEstimadoCentavos: c.valorTotalEstimadoCentavos,
        bruto: c.bruto,
      },
    })
    // xmax = 0 no Postgres indica linha recém-inserida (não atualizada)
    .returning({ id: contratacao.id, novaRaw: sql<number>`(xmax = 0)` });

  return { id: linha!.id, nova: Boolean((linha as { novaRaw: unknown }).novaRaw) };
}

/** Upsert de itens por (contratacao_id, numero_item). */
export async function upsertItens(
  contratacaoId: string,
  itens: ItemInterno[],
): Promise<void> {
  if (itens.length === 0) return;
  await db
    .insert(itemContratacao)
    .values(
      itens.map((i) => ({
        contratacaoId,
        numeroItem: i.numeroItem,
        descricao: i.descricao,
        materialOuServico: i.materialOuServico,
        quantidade: i.quantidade == null ? null : String(i.quantidade),
        unidadeMedida: i.unidadeMedida,
        valorUnitarioEstimadoCentavos: i.valorUnitarioEstimadoCentavos,
        valorTotalCentavos: i.valorTotalCentavos,
        tipoBeneficioId: i.tipoBeneficioId,
        tipoBeneficioNome: i.tipoBeneficioNome,
        bruto: i.bruto,
      })),
    )
    .onConflictDoUpdate({
      target: [itemContratacao.contratacaoId, itemContratacao.numeroItem],
      set: {
        descricao: sql`excluded.descricao`,
        tipoBeneficioNome: sql`excluded.tipo_beneficio_nome`,
        bruto: sql`excluded.bruto`,
      },
    });
}
