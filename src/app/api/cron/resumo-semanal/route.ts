import { autorizarCron } from "@/src/server/cron/guard";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Resumo de sábado — vai para todos os ativos, inclusive quem não recebeu nada. */
export async function GET(req: Request) {
  const naoAutorizado = autorizarCron(req);
  if (naoAutorizado) return naoAutorizado;
  return Response.json({ ok: true, etapa: "resumo-semanal", pendente: "resumoSemanalJob()" });
}
