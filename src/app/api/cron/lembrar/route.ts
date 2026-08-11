import { autorizarCron } from "@/src/server/cron/guard";
import { lembrarJob } from "@/src/server/alerta/lembrar.job";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Lembrete D-1: avisa quem já recebeu o alerta que o prazo está fechando. */
export async function GET(req: Request) {
  const naoAutorizado = autorizarCron(req);
  if (naoAutorizado) return naoAutorizado;

  const resultado = await lembrarJob();
  return Response.json({ ok: true, etapa: "lembrar", ...resultado });
}
