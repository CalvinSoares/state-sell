import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { assinante } from "./assinante";
import { contratacao, itemContratacao } from "./contratacao";

export const alerta = pgTable(
  "alerta",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assinanteId: uuid("assinante_id")
      .notNull()
      .references(() => assinante.id, { onDelete: "cascade" }),
    contratacaoId: uuid("contratacao_id")
      .notNull()
      .references(() => contratacao.id, { onDelete: "cascade" }),
    ramoSlug: text("ramo_slug").notNull(),
    itemIdPrincipal: uuid("item_id_principal").references(() => itemContratacao.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("pendente"), // pendente | enviado | falhou | suprimido
    motivoSupressao: text("motivo_supressao"),
    enviadoEm: timestamp("enviado_em", { withTimezone: true }),
    resendId: text("resend_id"),
    abertoEm: timestamp("aberto_em", { withTimezone: true }),
    clicadoEm: timestamp("clicado_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // A ÚNICA defesa contra alerta duplicado. Ver fluxos-criticos.md P0.
    unique("uq_alerta_assinante_contratacao").on(t.assinanteId, t.contratacaoId),
    index("idx_alerta_status").on(t.status),
    index("idx_alerta_assinante").on(t.assinanteId),
  ],
);

export const feedbackAlerta = pgTable("feedback_alerta", {
  id: uuid("id").defaultRandom().primaryKey(),
  alertaId: uuid("alerta_id")
    .notNull()
    .references(() => alerta.id, { onDelete: "cascade" }),
  util: boolean("util").notNull(),
  motivo: text("motivo"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});
