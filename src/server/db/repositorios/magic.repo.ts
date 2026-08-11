import "server-only";
import { db } from "@/src/server/db";
import { magicUsado } from "@/src/server/db/schema";

/**
 * Consome um magic link (uso único). Insere o jti; se já existia, o link já
 * foi usado → retorna false. Atômico pelo PRIMARY KEY. Ver auditoria.
 */
export async function consumirMagic(jti: string): Promise<boolean> {
  const inseridos = await db
    .insert(magicUsado)
    .values({ jti })
    .onConflictDoNothing({ target: magicUsado.jti })
    .returning({ jti: magicUsado.jti });
  return inseridos.length > 0;
}
