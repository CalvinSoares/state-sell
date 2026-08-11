import "server-only";
import { env } from "@/src/env";

/** Comparação de tempo constante (evita canal de timing sobre o segredo). */
function igualConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Toda rota /api/cron/* exige Authorization: Bearer ${CRON_SECRET}.
 * Sem header válido → 401, inclusive em preview. Ver coleta-e-jobs.md.
 */
export function autorizarCron(req: Request): Response | null {
  const esperado = env.CRON_SECRET;
  if (!esperado) {
    return new Response("CRON_SECRET não configurado", { status: 503 });
  }
  const header = req.headers.get("authorization") ?? "";
  if (!igualConstante(header, `Bearer ${esperado}`)) {
    return new Response("Não autorizado", { status: 401 });
  }
  return null;
}
