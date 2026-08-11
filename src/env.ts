/**
 * Validação de variáveis de ambiente. Segredo nunca vai para o cliente.
 * Ver docs/base-de-conhecimentos/arquitetura/visao-geral.md (Segredos).
 */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_MODE: z.enum(["live", "dry"]).default("dry"),
    /** Remetente. Antes de verificar domínio, use "Prefeitura Quer <onboarding@resend.dev>". */
    RESEND_FROM: z.string().default("Prefeitura Quer <avisos@prefeituraquer.com.br>"),
    /** Segredo do webhook do Resend (Svix), whsec_... — para validar assinatura. */
    RESEND_WEBHOOK_SECRET: z.string().optional(),
    CRON_SECRET: z.string().min(1).optional(),
    AUTH_SECRET: z.string().min(1).optional(),
    ADMIN_EMAILS: z.string().default(""),
    /** Senha do backoffice (2º fator além da allowlist de e-mail). */
    ADMIN_PASSWORD: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_MODE: process.env.RESEND_MODE,
    RESEND_FROM: process.env.RESEND_FROM,
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL,
  },
  // Testes e drizzle-kit não precisam do env completo validado.
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1" || process.env.NODE_ENV === "test",
  emptyStringAsUndefined: true,
});

/** Lista de e-mails com acesso ao backoffice. */
export function adminEmails(): string[] {
  return env.ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
