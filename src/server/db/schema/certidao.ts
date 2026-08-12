import { date, index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { assinante } from "./assinante";

/**
 * Cofre de certidões — metadados + vencimento + pathname do PDF no Blob privado.
 * Ver cofre-de-certidoes.md.
 */
export const certidao = pgTable(
  "certidao",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assinanteId: uuid("assinante_id")
      .notNull()
      .references(() => assinante.id, { onDelete: "cascade" }),
    /** cnd_federal | fgts | cndt | estadual | municipal */
    tipo: text("tipo").notNull(),
    /** Data de vencimento informada (calendário, sem hora). */
    vencimentoEm: date("vencimento_em", { mode: "string" }).notNull(),
    /** Pathname no Vercel Blob privado (ex.: certidoes/{assinante}/{id}.pdf). */
    arquivoChave: text("arquivo_chave"),
    lembrete15Em: timestamp("lembrete_15_em", { withTimezone: true }),
    lembrete3Em: timestamp("lembrete_3_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("uq_certidao_assinante_tipo").on(t.assinanteId, t.tipo),
    index("idx_certidao_assinante").on(t.assinanteId),
    index("idx_certidao_vencimento").on(t.vencimentoEm),
  ],
);
