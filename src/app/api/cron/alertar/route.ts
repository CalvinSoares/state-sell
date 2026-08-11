import { autorizarCron } from "@/src/server/cron/guard";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Decide quem recebe o quê. Cria alertas pendentes. Não envia. */
export async function GET(req: Request) {
  const naoAutorizado = autorizarCron(req);
  if (naoAutorizado) return naoAutorizado;
  return Response.json({ ok: true, etapa: "alertar", pendente: "alertarJob()" });
}
