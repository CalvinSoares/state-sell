import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const execucaoColeta = pgTable("execucao_coleta", {
  id: uuid("id").defaultRandom().primaryKey(),
  iniciadaEm: timestamp("iniciada_em", { withTimezone: true }).notNull().defaultNow(),
  terminadaEm: timestamp("terminada_em", { withTimezone: true }),
  uf: text("uf"),
  modalidadeId: integer("modalidade_id"),
  paginasLidas: integer("paginas_lidas").notNull().default(0),
  novas: integer("novas").notNull().default(0),
  atualizadas: integer("atualizadas").notNull().default(0),
  erros: integer("erros").notNull().default(0),
  status: text("status").notNull().default("rodando"), // rodando | ok | falhou
});

/** Cursor por (uf:modalidade). chave = "SP:8". Ver coleta-e-jobs.md. */
export const cursorColeta = pgTable("cursor_coleta", {
  chave: text("chave").primaryKey(),
  ultimaPagina: integer("ultima_pagina").notNull().default(1),
  ultimaDataProcessada: text("ultima_data_processada"),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});
