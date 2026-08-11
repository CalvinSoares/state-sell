import { autorizarCron } from "@/src/server/cron/guard";
import { coletarJob } from "@/src/server/coleta/coletar.job";
import { casarJob } from "@/src/server/coleta/casar.job";
import { alertarJob } from "@/src/server/alerta/alertar.job";
import { enviarJob } from "@/src/server/alerta/enviar.job";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Pipeline diário em uma invocação: coleta → casar → alertar → enviar.
 * Feito para o plano Hobby (1 cron/dia). Cada etapa é idempotente; se o tempo
 * acabar na coleta, as demais pegam o que já entrou e o próximo tick continua.
 * Ver coleta-e-jobs.md e ADR-002.
 */
async function etapa<T>(fn: () => Promise<T>): Promise<T | { erro: string }> {
  try {
    return await fn();
  } catch (e) {
    // Uma etapa que falha não pode derrubar as outras — cada uma é idempotente.
    return { erro: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(req: Request) {
  const naoAutorizado = autorizarCron(req);
  if (naoAutorizado) return naoAutorizado;

  const coletar = await etapa(coletarJob);
  const casar = await etapa(casarJob);
  const alertar = await etapa(alertarJob);
  const enviar = await etapa(enviarJob);

  return Response.json({ ok: true, etapa: "tick", coletar, casar, alertar, enviar });
}
