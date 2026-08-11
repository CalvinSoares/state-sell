import { autorizarCron } from "@/src/server/cron/guard";
import { enviarJob } from "@/src/server/alerta/enviar.job";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Envia alertas pendentes via Resend. Só I/O. Trava contra envio fora de produção. */
export async function GET(req: Request) {
  const naoAutorizado = autorizarCron(req);
  if (naoAutorizado) return naoAutorizado;

  const resultado = await enviarJob();
  return Response.json({ ok: true, etapa: "enviar", ...resultado });
}
