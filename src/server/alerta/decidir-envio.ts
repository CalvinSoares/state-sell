/**
 * Decisão pura de SE o e-mail vai de verdade. A trava mais importante do produto:
 * mandar e-mail de teste para assinante real custa a pessoa e o domínio.
 * Ver alertas-e-envio.md e visao-geral.md (Trava contra disparo acidental).
 */

export type ModoEnvio = "live" | "dry";

export type DecisaoEnvio = { enviarDeVerdade: boolean; motivo: string };

/** Só envia de verdade em produção E com RESEND_MODE=live. Qualquer outra combinação simula. */
export function decidirEnvio(nodeEnv: string, resendMode: ModoEnvio, temApiKey: boolean): DecisaoEnvio {
  if (nodeEnv !== "production") {
    return { enviarDeVerdade: false, motivo: `ambiente ${nodeEnv} — simulado` };
  }
  if (resendMode !== "live") {
    return { enviarDeVerdade: false, motivo: "RESEND_MODE != live — simulado" };
  }
  if (!temApiKey) {
    return { enviarDeVerdade: false, motivo: "sem RESEND_API_KEY — simulado" };
  }
  return { enviarDeVerdade: true, motivo: "produção + live" };
}
