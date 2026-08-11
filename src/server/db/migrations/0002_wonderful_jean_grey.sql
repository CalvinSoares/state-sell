CREATE TABLE "magic_usado" (
	"jti" text PRIMARY KEY NOT NULL,
	"usado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_contratacao_coletado" ON "contratacao" USING btree ("coletado_em");--> statement-breakpoint
CREATE INDEX "idx_contratacao_situacao_encerramento" ON "contratacao" USING btree ("situacao_compra_id","data_encerramento_proposta");