import { autorizarCron } from "@/src/server/cron/guard";
import { coletarJob } from "@/src/server/coleta/coletar.job";

// Orçamento de tempo do job (300s de teto na Vercel, com margem). Ver coleta-e-jobs.md.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Coleta contratações abertas + itens. Idempotente, dirigida por cursor. */
export async function GET(req: Request) {
  const naoAutorizado = autorizarCron(req);
  if (naoAutorizado) return naoAutorizado;

  const resultado = await coletarJob();
  return Response.json({ ok: true, etapa: "coletar", ...resultado });
}
