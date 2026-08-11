import "server-only";
import { desc } from "drizzle-orm";
import { db } from "@/src/server/db";
import { assinante, execucaoColeta } from "@/src/server/db/schema";
import { mascararEmail } from "@/src/shared/utils/mascarar";

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
