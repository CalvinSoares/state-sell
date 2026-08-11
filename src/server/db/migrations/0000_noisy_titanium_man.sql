CREATE TABLE "assinante" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nome" text,
	"telefone" text,
	"status" text DEFAULT 'pendente' NOT NULL,
	"plano" text DEFAULT 'gratis' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"verificado_em" timestamp with time zone,
	CONSTRAINT "assinante_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "perfil_busca" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assinante_id" uuid NOT NULL,
	"uf" text,
	"municipios_ibge" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ramos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"teto_valor_centavos" bigint,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classificacao_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"ramo_slug" text NOT NULL,
	"score" text NOT NULL,
	"termos_casados" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"escala" text,
	"versao_catalogo" integer NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_classificacao" UNIQUE("item_id","ramo_slug","versao_catalogo")
);
--> statement-breakpoint
CREATE TABLE "contratacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero_controle_pncp" text NOT NULL,
	"cnpj_orgao" text NOT NULL,
	"orgao_razao_social" text NOT NULL,
	"ano" integer NOT NULL,
	"sequencial" integer NOT NULL,
	"objeto_compra" text NOT NULL,
	"informacao_complementar" text,
	"valor_total_estimado_centavos" bigint,
	"uf" text NOT NULL,
	"codigo_ibge" text NOT NULL,
	"municipio_nome" text NOT NULL,
	"unidade_nome" text,
	"modalidade_id" integer NOT NULL,
	"situacao_compra_id" integer NOT NULL,
	"data_publicacao_pncp" timestamp with time zone,
	"data_abertura_proposta" timestamp with time zone,
	"data_encerramento_proposta" timestamp with time zone,
	"link_sistema_origem" text,
	"bruto" jsonb NOT NULL,
	"coletado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contratacao_numero_controle_pncp_unique" UNIQUE("numero_controle_pncp")
);
--> statement-breakpoint
CREATE TABLE "item_contratacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contratacao_id" uuid NOT NULL,
	"numero_item" integer NOT NULL,
	"descricao" text NOT NULL,
	"material_ou_servico" text,
	"quantidade" text,
	"unidade_medida" text,
	"valor_unitario_estimado_centavos" bigint,
	"valor_total_centavos" bigint,
	"tipo_beneficio_id" integer,
	"tipo_beneficio_nome" text,
	"bruto" jsonb NOT NULL,
	CONSTRAINT "uq_item_contratacao" UNIQUE("contratacao_id","numero_item")
);
--> statement-breakpoint
CREATE TABLE "alerta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assinante_id" uuid NOT NULL,
	"contratacao_id" uuid NOT NULL,
	"ramo_slug" text NOT NULL,
	"item_id_principal" uuid,
	"status" text DEFAULT 'pendente' NOT NULL,
	"motivo_supressao" text,
	"enviado_em" timestamp with time zone,
	"resend_id" text,
	"aberto_em" timestamp with time zone,
	"clicado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_alerta_assinante_contratacao" UNIQUE("assinante_id","contratacao_id")
);
--> statement-breakpoint
CREATE TABLE "feedback_alerta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alerta_id" uuid NOT NULL,
	"util" boolean NOT NULL,
	"motivo" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cursor_coleta" (
	"chave" text PRIMARY KEY NOT NULL,
	"ultima_pagina" integer DEFAULT 1 NOT NULL,
	"ultima_data_processada" text,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execucao_coleta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"iniciada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"terminada_em" timestamp with time zone,
	"uf" text,
	"modalidade_id" integer,
	"paginas_lidas" integer DEFAULT 0 NOT NULL,
	"novas" integer DEFAULT 0 NOT NULL,
	"atualizadas" integer DEFAULT 0 NOT NULL,
	"erros" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'rodando' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_email" text NOT NULL,
	"acao" text NOT NULL,
	"entidade" text,
	"entidade_id" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rotulo_manual" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hash_texto" text NOT NULL,
	"descricao_item" text NOT NULL,
	"objeto_compra" text NOT NULL,
	"ramo_esperado" text,
	"origem_amostra" text NOT NULL,
	"viu_palpite" boolean DEFAULT false NOT NULL,
	"nota" text,
	"rotulado_por" text NOT NULL,
	"rotulado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rotulo_manual_hash_texto_unique" UNIQUE("hash_texto")
);
--> statement-breakpoint
ALTER TABLE "perfil_busca" ADD CONSTRAINT "perfil_busca_assinante_id_assinante_id_fk" FOREIGN KEY ("assinante_id") REFERENCES "public"."assinante"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classificacao_item" ADD CONSTRAINT "classificacao_item_item_id_item_contratacao_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item_contratacao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_contratacao" ADD CONSTRAINT "item_contratacao_contratacao_id_contratacao_id_fk" FOREIGN KEY ("contratacao_id") REFERENCES "public"."contratacao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_assinante_id_assinante_id_fk" FOREIGN KEY ("assinante_id") REFERENCES "public"."assinante"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_contratacao_id_contratacao_id_fk" FOREIGN KEY ("contratacao_id") REFERENCES "public"."contratacao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_item_id_principal_item_contratacao_id_fk" FOREIGN KEY ("item_id_principal") REFERENCES "public"."item_contratacao"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_alerta" ADD CONSTRAINT "feedback_alerta_alerta_id_alerta_id_fk" FOREIGN KEY ("alerta_id") REFERENCES "public"."alerta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_perfil_assinante" ON "perfil_busca" USING btree ("assinante_id");--> statement-breakpoint
CREATE INDEX "idx_classificacao_ramo" ON "classificacao_item" USING btree ("ramo_slug");--> statement-breakpoint
CREATE INDEX "idx_classificacao_versao" ON "classificacao_item" USING btree ("versao_catalogo");--> statement-breakpoint
CREATE INDEX "idx_contratacao_uf" ON "contratacao" USING btree ("uf");--> statement-breakpoint
CREATE INDEX "idx_contratacao_ibge" ON "contratacao" USING btree ("codigo_ibge");--> statement-breakpoint
CREATE INDEX "idx_contratacao_encerramento" ON "contratacao" USING btree ("data_encerramento_proposta");--> statement-breakpoint
CREATE INDEX "idx_alerta_status" ON "alerta" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_alerta_assinante" ON "alerta" USING btree ("assinante_id");--> statement-breakpoint
CREATE INDEX "idx_rotulo_ramo" ON "rotulo_manual" USING btree ("ramo_esperado");