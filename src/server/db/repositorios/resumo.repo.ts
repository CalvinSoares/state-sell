import "server-only";
import { and, count, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/src/server/db";
import { alerta, contratacao } from "@/src/server/db/schema";
import type { PerfilAssinante } from "@/src/server/alerta/selecionar";

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
 * Quantas contratações foram COLETADAS na região do perfil desde `desde`.
 * "Prova de trabalho" do resumo — mostra que o robô rodou, não que casaram.
 */
export async function contarContratacoesNaRegiao(
  p: PerfilAssinante,
  desde: Date,
): Promise<number> {
  const filtroGeo =
    p.municipiosIbge.length > 0
      ? inArray(contratacao.codigoIbge, p.municipiosIbge)
      : p.uf
        ? eq(contratacao.uf, p.uf)
        : sql`false`;

  const [linha] = await db
    .select({ n: count() })
    .from(contratacao)
    .where(and(gte(contratacao.coletadoEm, desde), filtroGeo));

  return linha?.n ?? 0;
}

/** Quantos alertas foram enviados ao assinante desde `desde`. */
export async function contarAlertasNaSemana(assinanteId: string, desde: Date): Promise<number> {
  const [linha] = await db
    .select({ n: count() })
    .from(alerta)
    .where(
      and(
        eq(alerta.assinanteId, assinanteId),
        eq(alerta.status, "enviado"),
        gte(alerta.enviadoEm, desde),
      ),
    );
  return linha?.n ?? 0;
}
