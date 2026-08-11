import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Rotulagem feita no backoffice. `pnpm rotulos:sync` exporta para
 * fixtures/rotulados/*.json — que é o que o CI lê. Ver ADR-007.
 */
export const rotuloManual = pgTable(
  "rotulo_manual",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // dedup: um rótulo vale para todo texto idêntico, inclusive futuro
    hashTexto: text("hash_texto").notNull().unique(),
    descricaoItem: text("descricao_item").notNull(),
    objetoCompra: text("objeto_compra").notNull(),
    ramoEsperado: text("ramo_esperado"), // null = não é de nenhum ramo
    origemAmostra: text("origem_amostra").notNull(), // dirigida | aleatoria | feedback | duvida
    viuPalpite: boolean("viu_palpite").notNull().default(false),
    nota: text("nota"),
    rotuladoPor: text("rotulado_por").notNull(),
    rotuladoEm: timestamp("rotulado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_rotulo_ramo").on(t.ramoEsperado)],
);

export const logAdmin = pgTable("log_admin", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminEmail: text("admin_email").notNull(),
  acao: text("acao").notNull(),
  entidade: text("entidade"),
  entidadeId: text("entidade_id"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});
