import { autorizarCron } from "@/src/server/cron/guard";
import { lembrarCertidoesJob } from "@/src/server/certidoes/lembrar.job";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Lembretes D-15 e D-3 do cofre de certidões. */
export async function GET(req: Request) {
  const naoAutorizado = autorizarCron(req);
  if (naoAutorizado) return naoAutorizado;

  const resultado = await lembrarCertidoesJob();
  return Response.json({ ok: true, etapa: "lembrar-certidoes", ...resultado });
}
