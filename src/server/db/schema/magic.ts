import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Magic links já usados (uso único). Guarda o `jti` do token; a primeira
 * verificação insere, a segunda falha por conflito. Ver auditoria (magic link
 * reutilizável na validade). Uma linha por link; pode ser podada por idade.
 */
export const magicUsado = pgTable("magic_usado", {
  jti: text("jti").primaryKey(),
  usadoEm: timestamp("usado_em", { withTimezone: true }).notNull().defaultNow(),
});
