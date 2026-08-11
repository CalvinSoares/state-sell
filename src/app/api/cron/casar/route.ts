import { autorizarCron } from "@/src/server/cron/guard";
import { casarJob } from "@/src/server/coleta/casar.job";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Classifica itens ainda sem classificação na versão atual do catálogo. */
export async function GET(req: Request) {
  const naoAutorizado = autorizarCron(req);
  if (naoAutorizado) return naoAutorizado;

  const resultado = await casarJob();
  return Response.json({ ok: true, etapa: "casar", ...resultado });
}
