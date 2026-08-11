import { env } from "@/src/env";
import { log } from "@/src/server/log";
import { verificarSvix } from "@/src/server/webhook/svix";
import { suprimirAssinante } from "@/src/server/db/repositorios/assinante.repo";

export const dynamic = "force-dynamic";

/** Eventos que fazem a gente parar de enviar para o endereço. */
const EVENTOS_SUPRESSAO = new Set(["email.bounced", "email.complained"]);

/**
 * Webhook do Resend. Bounce forte ou reclamação → suprime o assinante,
 * protegendo a reputação do domínio. Ver alertas-e-envio.md e roadmap (2.2).
 * Nunca loga o e-mail (dado pessoal) — só o tipo do evento e a contagem.
 */
export async function POST(req: Request) {
  const corpo = await req.text();

  // Se há segredo configurado, a assinatura é obrigatória (não aceitamos forjado).
  if (env.RESEND_WEBHOOK_SECRET) {
    const ok = await verificarSvix(
      corpo,
      {
        id: req.headers.get("svix-id"),
        timestamp: req.headers.get("svix-timestamp"),
        signature: req.headers.get("svix-signature"),
      },
      env.RESEND_WEBHOOK_SECRET,
    );
    if (!ok) {
      log.error("webhook.resend.assinatura_invalida", {});
      return new Response("assinatura inválida", { status: 401 });
    }
  } else {
    // Sem segredo, não dá para confiar — recusa em produção.
    if (env.NODE_ENV === "production") {
      return new Response("webhook não configurado", { status: 503 });
    }
  }

  let evento: { type?: string; data?: { to?: string[] | string } };
  try {
    evento = JSON.parse(corpo);
  } catch {
    return new Response("json inválido", { status: 400 });
  }

  if (evento.type && EVENTOS_SUPRESSAO.has(evento.type)) {
    const destinatarios = Array.isArray(evento.data?.to)
      ? evento.data!.to
      : evento.data?.to
        ? [evento.data.to]
        : [];
    let suprimidos = 0;
    for (const email of destinatarios) suprimidos += await suprimirAssinante(email);
    log.info("webhook.resend.supressao", { tipo: evento.type, suprimidos });
  }

  return Response.json({ ok: true });
}
