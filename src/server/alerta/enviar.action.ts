import "server-only";
import { env } from "@/src/env";
import { log } from "@/src/server/log";
import type { EmailAlerta } from "./compor";
import { decidirEnvio } from "./decidir-envio";
import { renderHtml, renderTexto } from "./render";

const REMETENTE = "StateSell <avisos@statesell.com.br>";

export type ResultadoEnvio = { enviado: boolean; simulado: boolean; resendId: string | null };

/**
 * Envio genérico. Respeita a trava anti-disparo: fora de produção OU sem
 * RESEND_MODE=live, apenas registra que renderizou e marca como simulado.
 * NUNCA loga o destinatário (dado pessoal).
 */
export async function enviarEmailBruto(
  destinatario: string,
  assunto: string,
  html: string,
  texto: string,
): Promise<ResultadoEnvio> {
  const decisao = decidirEnvio(env.NODE_ENV, env.RESEND_MODE, Boolean(env.RESEND_API_KEY));

  if (!decisao.enviarDeVerdade) {
    log.info("email.simulado", { motivo: decisao.motivo, assunto });
    return { enviado: false, simulado: true, resendId: null };
  }

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from: REMETENTE, to: destinatario, subject: assunto, html, text: texto }),
  });

  if (!resp.ok) {
    const corpo = await resp.text().catch(() => "");
    throw new Error(`Resend ${resp.status}: ${corpo.slice(0, 200)}`);
  }

  const dados = (await resp.json()) as { id?: string };
  return { enviado: true, simulado: false, resendId: dados.id ?? null };
}

/** Envia um alerta (compõe HTML/texto e delega ao envio genérico). */
export async function enviarEmailAlerta(
  destinatario: string,
  email: EmailAlerta,
): Promise<ResultadoEnvio> {
  return enviarEmailBruto(destinatario, email.assunto, renderHtml(email), renderTexto(email));
}
