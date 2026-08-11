import "server-only";
import { env } from "@/src/env";

/**
 * Toda rota /api/cron/* exige Authorization: Bearer ${CRON_SECRET}.
 * Sem header válido → 401, inclusive em preview. Ver coleta-e-jobs.md.
 */
export function autorizarCron(req: Request): Response | null {
  const esperado = env.CRON_SECRET;
  if (!esperado) {
    return new Response("CRON_SECRET não configurado", { status: 503 });
  }
  const header = req.headers.get("authorization");
  if (header !== `Bearer ${esperado}`) {
    return new Response("Não autorizado", { status: 401 });
  }
  return null;
}
