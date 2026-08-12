CREATE TABLE "certidao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assinante_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"vencimento_em" date NOT NULL,
	"arquivo_chave" text,
	"lembrete_15_em" timestamp with time zone,
	"lembrete_3_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certidao" ADD CONSTRAINT "certidao_assinante_id_assinante_id_fk" FOREIGN KEY ("assinante_id") REFERENCES "public"."assinante"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_certidao_assinante_tipo" ON "certidao" USING btree ("assinante_id","tipo");
--> statement-breakpoint
CREATE INDEX "idx_certidao_assinante" ON "certidao" USING btree ("assinante_id");
--> statement-breakpoint
CREATE INDEX "idx_certidao_vencimento" ON "certidao" USING btree ("vencimento_em");
