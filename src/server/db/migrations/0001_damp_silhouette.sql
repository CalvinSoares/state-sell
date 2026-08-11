CREATE TABLE "rate_limit" (
	"chave" text PRIMARY KEY NOT NULL,
	"janela_inicio" timestamp with time zone DEFAULT now() NOT NULL,
	"contador" integer DEFAULT 0 NOT NULL
);
