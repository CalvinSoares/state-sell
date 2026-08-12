import "server-only";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/src/server/db";
import { classificacaoItem, contratacao, itemContratacao } from "@/src/server/db/schema";
import { RAMO_SEM_CLASSIFICACAO } from "@/src/server/coleta/casar.job";
import { LIMIAR } from "@/src/server/casamento/casar";
import { orgaoHumano, ramoRotuloCurto } from "@/src/server/alerta/compor";
import { simularHistorico, type ContratacaoHistorica } from "@/src/server/alerta/simular";
import type { PerfilAssinante } from "@/src/server/alerta/selecionar";
import { RAMOS_POR_SLUG } from "@/content/ramos";
import { VERSAO_CATALOGO } from "@/src/shared/types/ramo";
import { prazoTexto } from "@/src/shared/utils/data";
import { valorAproximado } from "@/src/shared/utils/formatador";

export type ItemSimulacaoView = {
  titulo: string;
  item: string;
  valor: string | null;
  prazo: string | null;
  exclusivo: boolean;
};

export type SimulacaoView = {
  total: number;
  dias: number;
  itens: ItemSimulacaoView[];
};

/**
 * Contratações coletadas nos últimos `dias` na região do perfil, com itens
 * classificados na versão atual do catálogo.
 */
async function contratacoesHistoricas(
  perfil: Pick<PerfilAssinante, "uf" | "municipiosIbge" | "ramos">,
  desde: Date,
  versaoCatalogo: number,
): Promise<ContratacaoHistorica[]> {
  if (perfil.ramos.length === 0) return [];

  const geo =
    perfil.municipiosIbge.length > 0
      ? inArray(contratacao.codigoIbge, perfil.municipiosIbge)
      : perfil.uf
        ? eq(contratacao.uf, perfil.uf)
        : sql`false`;

  const linhas = await db
    .select({
      contratacaoId: contratacao.id,
      codigoIbge: contratacao.codigoIbge,
      uf: contratacao.uf,
      valorTotalEstimadoCentavos: contratacao.valorTotalEstimadoCentavos,
      situacaoCompraId: contratacao.situacaoCompraId,
      dataEncerramentoProposta: contratacao.dataEncerramentoProposta,
      coletadoEm: contratacao.coletadoEm,
      orgao: contratacao.orgaoRazaoSocial,
      municipio: contratacao.municipioNome,
      itemId: itemContratacao.id,
      itemDescricao: itemContratacao.descricao,
      ramoSlug: classificacaoItem.ramoSlug,
      score: classificacaoItem.score,
      valorItemCentavos: itemContratacao.valorTotalCentavos,
      tipoBeneficioNome: itemContratacao.tipoBeneficioNome,
    })
    .from(contratacao)
    .innerJoin(itemContratacao, eq(itemContratacao.contratacaoId, contratacao.id))
    .innerJoin(classificacaoItem, eq(classificacaoItem.itemId, itemContratacao.id))
    .where(
      and(
        gte(contratacao.coletadoEm, desde),
        geo,
        inArray(classificacaoItem.ramoSlug, perfil.ramos),
        eq(classificacaoItem.versaoCatalogo, versaoCatalogo),
        sql`${classificacaoItem.ramoSlug} <> ${RAMO_SEM_CLASSIFICACAO}`,
        sql`${classificacaoItem.score}::numeric >= ${LIMIAR}`,
      ),
    );

  const mapa = new Map<string, ContratacaoHistorica>();
  for (const l of linhas) {
    let c = mapa.get(l.contratacaoId);
    if (!c) {
      c = {
        contratacaoId: l.contratacaoId,
        codigoIbge: l.codigoIbge,
        uf: l.uf,
        valorTotalEstimadoCentavos: l.valorTotalEstimadoCentavos,
        situacaoCompraId: l.situacaoCompraId,
        dataEncerramentoProposta: l.dataEncerramentoProposta,
        coletadoEm: l.coletadoEm,
        orgaoRazaoSocial: l.orgao,
        municipioNome: l.municipio,
        itemDescricaoPorId: {},
        itens: [],
      };
      mapa.set(l.contratacaoId, c);
    }
    c.itemDescricaoPorId[l.itemId] = l.itemDescricao;
    c.itens.push({
      itemId: l.itemId,
      ramoSlug: l.ramoSlug,
      score: Number(l.score),
      valorTotalCentavos: l.valorItemCentavos,
      exclusivoMeEpp: (l.tipoBeneficioNome ?? "").toLowerCase().includes("exclusiv"),
    });
  }
  return [...mapa.values()];
}

/** Simula o que o perfil teria recebido nos últimos `dias`. */
export async function simularParaPerfil(
  perfil: PerfilAssinante,
  agora: Date,
  dias: number,
  limiteItens = 8,
): Promise<SimulacaoView> {
  const desde = new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);
  const candidatas = await contratacoesHistoricas(perfil, desde, VERSAO_CATALOGO);
  const resultados = simularHistorico(candidatas, perfil);

  return {
    total: resultados.length,
    dias,
    itens: resultados.slice(0, limiteItens).map((r) => ({
      titulo: `${orgaoHumano(r.orgaoRazaoSocial, r.municipioNome)} quer comprar ${ramoRotuloCurto(
        RAMOS_POR_SLUG.get(r.ramoSlug)?.rotulo ?? r.ramoSlug,
      )}`,
      item: r.itemDescricao.slice(0, 120),
      valor: valorAproximado(r.valorTotalEstimadoCentavos),
      prazo: r.dataEncerramentoProposta
        ? prazoTexto(r.dataEncerramentoProposta, agora)
        : null,
      exclusivo: r.exclusivoMeEpp,
    })),
  };
}
