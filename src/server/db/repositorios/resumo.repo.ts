import "server-only";
import { and, count, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/src/server/db";
import { alerta, contratacao } from "@/src/server/db/schema";

/** Órgão + município por id de contratação, para o texto das aberturas do resumo. */
export async function detalhesContratacoes(
  ids: string[],
): Promise<Map<string, { orgaoRazaoSocial: string; municipioNome: string }>> {
  if (ids.length === 0) return new Map();
  const linhas = await db
    .select({
      id: contratacao.id,
      orgaoRazaoSocial: contratacao.orgaoRazaoSocial,
      municipioNome: contratacao.municipioNome,
    })
    .from(contratacao)
    .where(inArray(contratacao.id, ids));
  return new Map(linhas.map((l) => [l.id, { orgaoRazaoSocial: l.orgaoRazaoSocial, municipioNome: l.municipioNome }]));
}

/**
 * Contratações coletadas desde `desde`, agrupadas por município e por UF —
 * DUAS queries no total, em vez de uma por assinante (evita N+1 no resumo).
 * O job soma em memória conforme a região de cada perfil. Ver auditoria #13/#14.
 */
export async function contratacoesColetadasPorRegiao(
  desde: Date,
): Promise<{ porIbge: Map<string, number>; porUf: Map<string, number> }> {
  const porIbgeLinhas = await db
    .select({ chave: contratacao.codigoIbge, n: count() })
    .from(contratacao)
    .where(gte(contratacao.coletadoEm, desde))
    .groupBy(contratacao.codigoIbge);

  const porUfLinhas = await db
    .select({ chave: contratacao.uf, n: count() })
    .from(contratacao)
    .where(gte(contratacao.coletadoEm, desde))
    .groupBy(contratacao.uf);

  return {
    porIbge: new Map(porIbgeLinhas.map((l) => [l.chave, Number(l.n)])),
    porUf: new Map(porUfLinhas.map((l) => [l.chave, Number(l.n)])),
  };
}

/** Alertas enviados desde `desde`, por assinante (uma query, não uma por assinante). */
export async function alertasEnviadosDesdePorAssinante(desde: Date): Promise<Map<string, number>> {
  const linhas = await db
    .select({ assinanteId: alerta.assinanteId, n: count() })
    .from(alerta)
    .where(and(eq(alerta.status, "enviado"), gte(alerta.enviadoEm, desde)))
    .groupBy(alerta.assinanteId);
  return new Map(linhas.map((l) => [l.assinanteId, Number(l.n)]));
}
