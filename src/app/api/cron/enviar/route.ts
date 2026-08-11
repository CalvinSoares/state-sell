import { autorizarCron } from "@/src/server/cron/guard";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Envia alertas pendentes via Resend. Só I/O. Trava contra envio fora de produção. */
export async function GET(req: Request) {
  const naoAutorizado = autorizarCron(req);
  if (naoAutorizado) return naoAutorizado;
  return Response.json({ ok: true, etapa: "enviar", pendente: "enviarJob()" });
}
