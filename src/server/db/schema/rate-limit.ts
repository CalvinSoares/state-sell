import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Rate limit de janela fixa, no próprio Postgres (sem infra extra).
 * Uma linha por chave (ex.: "cadastro:ip:1.2.3.4" ou "acesso:email:x@y").
 * Ver roadmap-melhorias.md (rate limit) e auditoria #2.
 */
export const rateLimit = pgTable("rate_limit", {
  chave: text("chave").primaryKey(),
  janelaInicio: timestamp("janela_inicio", { withTimezone: true }).notNull().defaultNow(),
  contador: integer("contador").notNull().default(0),
});
