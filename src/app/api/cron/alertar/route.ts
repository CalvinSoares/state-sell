import { autorizarCron } from "@/src/server/cron/guard";
import { alertarJob } from "@/src/server/alerta/alertar.job";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Decide quem recebe o quê. Cria alertas pendentes. Não envia. */
export async function GET(req: Request) {
  const naoAutorizado = autorizarCron(req);
  if (naoAutorizado) return naoAutorizado;

  const resultado = await alertarJob();
  return Response.json({ ok: true, etapa: "alertar", ...resultado });
}
