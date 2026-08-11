import { bigint, boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Nomes de tabela/coluna em snake_case português (ADR-006).
 * Valor monetário em centavos, bigint. Data com timezone.
 */

export const assinante = pgTable("assinante", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  nome: text("nome"),
  telefone: text("telefone"),
  status: text("status").notNull().default("pendente"), // pendente | ativo | suprimido
  plano: text("plano").notNull().default("gratis"), // gratis | pago
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  verificadoEm: timestamp("verificado_em", { withTimezone: true }),
});

export const perfilBusca = pgTable(
  "perfil_busca",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assinanteId: uuid("assinante_id")
      .notNull()
      .references(() => assinante.id, { onDelete: "cascade" }),
    uf: text("uf"),
    // v1: lista de códigos IBGE; vazio = estado inteiro (uf)
    municipiosIbge: jsonb("municipios_ibge").$type<string[]>().notNull().default([]),
    ramos: jsonb("ramos").$type<string[]>().notNull().default([]),
    tetoValorCentavos: bigint("teto_valor_centavos", { mode: "bigint" }),
    ativo: boolean("ativo").notNull().default(true),
  },
  (t) => [index("idx_perfil_assinante").on(t.assinanteId)],
);
