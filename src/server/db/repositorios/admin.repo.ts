import "server-only";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/src/server/db";
import {
  alerta,
  assinante,
  classificacaoItem,
  contratacao,
  execucaoColeta,
  feedbackAlerta,
  itemContratacao,
} from "@/src/server/db/schema";
import { mascararEmail } from "@/src/shared/utils/mascarar";
import { VERSAO_CATALOGO } from "@/src/shared/types/ramo";

export { mascararEmail };

/** Lista de assinantes para o backoffice. E-mail mascarado na listagem. */
export async function listarAssinantes(limite = 200) {
  const linhas = await db
    .select({
      id: assinante.id,
      email: assinante.email,
      nome: assinante.nome,
      status: assinante.status,
      plano: assinante.plano,
      criadoEm: assinante.criadoEm,
    })
    .from(assinante)
    .orderBy(desc(assinante.criadoEm))
    .limit(limite);

  return linhas.map((a) => ({ ...a, email: mascararEmail(a.email) }));
}

/** Últimas execuções de coleta, para /admin/jobs. */
export async function ultimasExecucoes(limite = 40) {
  return db.select().from(execucaoColeta).orderBy(desc(execucaoColeta.iniciadaEm)).limit(limite);
}

export type FiltroAlertasAdmin = {
  status?: string;
  soFeedbackNegativo?: boolean;
  limite?: number;
};

/** Alertas recentes com feedback, para /admin/alertas. */
export async function listarAlertasAdmin(filtro: FiltroAlertasAdmin = {}) {
  const limite = filtro.limite ?? 80;
  const conds = [];
  if (filtro.status) conds.push(eq(alerta.status, filtro.status));
  if (filtro.soFeedbackNegativo) conds.push(eq(feedbackAlerta.util, false));

  const linhas = await db
    .select({
      id: alerta.id,
      status: alerta.status,
      ramoSlug: alerta.ramoSlug,
      enviadoEm: alerta.enviadoEm,
      criadoEm: alerta.criadoEm,
      email: assinante.email,
      orgao: contratacao.orgaoRazaoSocial,
      municipio: contratacao.municipioNome,
      feedbackUtil: feedbackAlerta.util,
      feedbackMotivo: feedbackAlerta.motivo,
    })
    .from(alerta)
    .innerJoin(assinante, eq(assinante.id, alerta.assinanteId))
    .innerJoin(contratacao, eq(contratacao.id, alerta.contratacaoId))
    .leftJoin(feedbackAlerta, eq(feedbackAlerta.alertaId, alerta.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(alerta.criadoEm))
    .limit(limite);

  return linhas.map((l) => ({
    ...l,
    email: mascararEmail(l.email),
  }));
}

/** Busca diagnóstica de contratações por texto (órgão, município, objeto). */
export async function buscarContratacoes(termo: string, limite = 40) {
  const t = termo.trim();
  if (t.length < 2) return [];

  const like = `%${t}%`;
  const linhas = await db
    .select({
      id: contratacao.id,
      numeroControlePncp: contratacao.numeroControlePncp,
      orgao: contratacao.orgaoRazaoSocial,
      municipio: contratacao.municipioNome,
      uf: contratacao.uf,
      objeto: contratacao.objetoCompra,
      situacaoCompraId: contratacao.situacaoCompraId,
      dataEncerramentoProposta: contratacao.dataEncerramentoProposta,
      coletadoEm: contratacao.coletadoEm,
    })
    .from(contratacao)
    .where(
      or(
        ilike(contratacao.orgaoRazaoSocial, like),
        ilike(contratacao.municipioNome, like),
        ilike(contratacao.objetoCompra, like),
        ilike(contratacao.numeroControlePncp, like),
      ),
    )
    .orderBy(desc(contratacao.coletadoEm))
    .limit(limite);

  if (linhas.length === 0) return [];

  const ids = linhas.map((l) => l.id);
  const classes = await db
    .select({
      contratacaoId: itemContratacao.contratacaoId,
      ramoSlug: classificacaoItem.ramoSlug,
      score: classificacaoItem.score,
      item: itemContratacao.descricao,
    })
    .from(itemContratacao)
    .innerJoin(classificacaoItem, eq(classificacaoItem.itemId, itemContratacao.id))
    .where(
      and(
        inArray(itemContratacao.contratacaoId, ids),
        eq(classificacaoItem.versaoCatalogo, VERSAO_CATALOGO),
      ),
    );

  const classesPorId = new Map<string, { ramoSlug: string; score: string; item: string }[]>();
  for (const c of classes) {
    const lista = classesPorId.get(c.contratacaoId) ?? [];
    lista.push({ ramoSlug: c.ramoSlug, score: c.score, item: c.item });
    classesPorId.set(c.contratacaoId, lista);
  }

  return linhas.map((l) => ({
    ...l,
    classificacoes: (classesPorId.get(l.id) ?? []).slice(0, 5),
  }));
}
