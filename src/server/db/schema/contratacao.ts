import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const contratacao = pgTable(
  "contratacao",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    numeroControlePncp: text("numero_controle_pncp").notNull().unique(),
    cnpjOrgao: text("cnpj_orgao").notNull(),
    orgaoRazaoSocial: text("orgao_razao_social").notNull(),
    ano: integer("ano").notNull(),
    sequencial: integer("sequencial").notNull(),
    objetoCompra: text("objeto_compra").notNull(),
    informacaoComplementar: text("informacao_complementar"),
    valorTotalEstimadoCentavos: bigint("valor_total_estimado_centavos", { mode: "bigint" }),
    uf: text("uf").notNull(),
    codigoIbge: text("codigo_ibge").notNull(),
    municipioNome: text("municipio_nome").notNull(),
    unidadeNome: text("unidade_nome"),
    modalidadeId: integer("modalidade_id").notNull(),
    situacaoCompraId: integer("situacao_compra_id").notNull(),
    dataPublicacaoPncp: timestamp("data_publicacao_pncp", { withTimezone: true }),
    dataAberturaProposta: timestamp("data_abertura_proposta", { withTimezone: true }),
    dataEncerramentoProposta: timestamp("data_encerramento_proposta", { withTimezone: true }),
    linkSistemaOrigem: text("link_sistema_origem"),
    bruto: jsonb("bruto").notNull(),
    coletadoEm: timestamp("coletado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_contratacao_uf").on(t.uf),
    index("idx_contratacao_ibge").on(t.codigoIbge),
    index("idx_contratacao_encerramento").on(t.dataEncerramentoProposta),
  ],
);

export const itemContratacao = pgTable(
  "item_contratacao",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contratacaoId: uuid("contratacao_id")
      .notNull()
      .references(() => contratacao.id, { onDelete: "cascade" }),
    numeroItem: integer("numero_item").notNull(),
    descricao: text("descricao").notNull(),
    materialOuServico: text("material_ou_servico"),
    quantidade: text("quantidade"), // valor decimal do PNCP guardado como texto
    unidadeMedida: text("unidade_medida"),
    valorUnitarioEstimadoCentavos: bigint("valor_unitario_estimado_centavos", { mode: "bigint" }),
    valorTotalCentavos: bigint("valor_total_centavos", { mode: "bigint" }),
    tipoBeneficioId: integer("tipo_beneficio_id"),
    tipoBeneficioNome: text("tipo_beneficio_nome"),
    bruto: jsonb("bruto").notNull(),
  },
  (t) => [unique("uq_item_contratacao").on(t.contratacaoId, t.numeroItem)],
);

export const classificacaoItem = pgTable(
  "classificacao_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => itemContratacao.id, { onDelete: "cascade" }),
    ramoSlug: text("ramo_slug").notNull(),
    score: text("score").notNull(), // decimal 0..1 como texto
    termosCasados: jsonb("termos_casados").$type<string[]>().notNull().default([]),
    escala: text("escala"),
    versaoCatalogo: integer("versao_catalogo").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("uq_classificacao").on(t.itemId, t.ramoSlug, t.versaoCatalogo),
    index("idx_classificacao_ramo").on(t.ramoSlug),
    index("idx_classificacao_versao").on(t.versaoCatalogo),
  ],
);
