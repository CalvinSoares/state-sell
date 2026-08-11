import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/src/server/db";
import { cursorColeta, execucaoColeta } from "@/src/server/db/schema";

/** Mapa chave→timestamp(ms) do último cursor, para ordenar por mais antigo. */
export async function carregarCursores(): Promise<Map<string, number>> {
  const linhas = await db.select().from(cursorColeta);
  const mapa = new Map<string, number>();
  for (const l of linhas) mapa.set(l.chave, l.atualizadoEm.getTime());
  return mapa;
}

export async function lerCursor(chave: string): Promise<number> {
  const [l] = await db.select().from(cursorColeta).where(eq(cursorColeta.chave, chave));
  return l?.ultimaPagina ?? 1;
}

export async function salvarCursor(
  chave: string,
  ultimaPagina: number,
  ultimaDataProcessada: string,
): Promise<void> {
  await db
    .insert(cursorColeta)
    .values({ chave, ultimaPagina, ultimaDataProcessada, atualizadoEm: new Date() })
    .onConflictDoUpdate({
      target: cursorColeta.chave,
      set: { ultimaPagina, ultimaDataProcessada, atualizadoEm: new Date() },
    });
}

export async function iniciarExecucao(uf: string, modalidadeId: number): Promise<string> {
  const [l] = await db
    .insert(execucaoColeta)
    .values({ uf, modalidadeId, status: "rodando" })
    .returning({ id: execucaoColeta.id });
  return l!.id;
}

export async function finalizarExecucao(
  id: string,
  dados: { paginasLidas: number; novas: number; atualizadas: number; erros: number; status: string },
): Promise<void> {
  await db
    .update(execucaoColeta)
    .set({ ...dados, terminadaEm: new Date() })
    .where(eq(execucaoColeta.id, id));
}
