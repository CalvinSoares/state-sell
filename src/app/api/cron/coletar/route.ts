import { autorizarCron } from "@/src/server/cron/guard";

// Orçamento de tempo do job (300s de teto na Vercel, com margem). Ver coleta-e-jobs.md.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Coleta contratações abertas + itens. Idempotente, dirigida por cursor.
 * Corpo do job entra em src/server/coleta/coletar.job.ts (próximo passo da Fase 1).
 */
export async function GET(req: Request) {
  const naoAutorizado = autorizarCron(req);
  if (naoAutorizado) return naoAutorizado;

  // TODO(Fase 1): chamar coletarJob() — orquestração com cursor e lotes.
  return Response.json({ ok: true, etapa: "coletar", pendente: "coletarJob()" });
}
