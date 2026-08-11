import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/src/server/db";
import { execucaoColeta } from "@/src/server/db/schema";

export type StatusColeta = {
  ultimaColetaOk: Date | null;
  lidas24h: number;
  novas24h: number;
  erros24h: number;
};

/** Saúde da coleta para a página pública /status. Sem dado de assinante. */
export async function statusColeta(agora: Date): Promise<StatusColeta> {
  const desde = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

  const [ultima] = await db
    .select({ t: sql<Date | null>`max(${execucaoColeta.terminadaEm})` })
    .from(execucaoColeta)
    .where(eq(execucaoColeta.status, "ok"));

  const [janela] = await db
    .select({
      lidas: sql<number>`coalesce(sum(${execucaoColeta.novas} + ${execucaoColeta.atualizadas}), 0)`,
      novas: sql<number>`coalesce(sum(${execucaoColeta.novas}), 0)`,
      erros: sql<number>`coalesce(sum(${execucaoColeta.erros}), 0)`,
    })
    .from(execucaoColeta)
    .where(and(gte(execucaoColeta.iniciadaEm, desde)));

  return {
    ultimaColetaOk: ultima?.t ? new Date(ultima.t) : null,
    lidas24h: Number(janela?.lidas ?? 0),
    novas24h: Number(janela?.novas ?? 0),
    erros24h: Number(janela?.erros ?? 0),
  };
}
