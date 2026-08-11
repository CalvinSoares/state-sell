import "server-only";
import { env } from "@/src/env";
import { RAMOS_POR_SLUG } from "@/content/ramos";
import { log } from "@/src/server/log";
import { assinarValor } from "@/src/server/auth/token";
import {
  marcarEnviado,
  marcarFalhou,
  reivindicarParaEnvio,
} from "@/src/server/db/repositorios/alerta.repo";
import { comporEmail } from "./compor";
import { enviarEmailAlerta } from "./enviar.action";

const VALIDADE_FEEDBACK_MS = 90 * 24 * 60 * 60 * 1000; // 90 dias

async function urlNaoEraPraMim(alertaId: string, agoraMs: number): Promise<string | undefined> {
  if (!env.AUTH_SECRET) return undefined;
  const token = await assinarValor(alertaId, env.AUTH_SECRET, agoraMs, VALIDADE_FEEDBACK_MS);
  return `${env.NEXT_PUBLIC_APP_URL}/feedback?a=${alertaId}&t=${encodeURIComponent(token)}`;
}

export type ResultadoEnviar = { pendentes: number; enviados: number; simulados: number; falhas: number };

/** Envia (ou simula) alertas pendentes. Só I/O — a composição é pura. */
export async function enviarJob(agora: () => Date = () => new Date()): Promise<ResultadoEnviar> {
  const momento = agora();
  // Reivindica atomicamente (pendente→enviando): evita envio duplicado se dois
  // ticks se sobrepuserem. Ver auditoria #8.
  const pendentes = await reivindicarParaEnvio();
  let enviados = 0;
  let simulados = 0;
  let falhas = 0;

  for (const p of pendentes) {
    const ramo = RAMOS_POR_SLUG.get(p.ramoSlug);
    if (!ramo || !p.dataEncerramentoProposta) {
      await marcarFalhou(p.alertaId, "dados incompletos para compor");
      falhas++;
      continue;
    }

    const email = comporEmail(
      {
        orgaoRazaoSocial: p.orgaoRazaoSocial,
        municipioNome: p.municipioNome,
        unidadeNome: p.unidadeNome,
        valorTotalEstimadoCentavos: p.valorTotalEstimadoCentavos,
        dataEncerramentoProposta: p.dataEncerramentoProposta,
        linkSistemaOrigem: p.linkSistemaOrigem,
        numeroControlePncp: p.numeroControlePncp,
      },
      {
        descricao: p.itemDescricao,
        quantidade: p.itemQuantidade != null ? Number(p.itemQuantidade) : null,
        unidadeMedida: p.itemUnidade,
        exclusivoMeEpp: (p.itemTipoBeneficio ?? "").toLowerCase().includes("exclusiv"),
        escala: p.escala === "sim",
      },
      ramo.rotulo,
      p.termosCasados ?? [],
      env.NEXT_PUBLIC_APP_URL,
      momento,
      await urlNaoEraPraMim(p.alertaId, momento.getTime()),
    );

    try {
      const r = await enviarEmailAlerta(p.email, email);
      await marcarEnviado(p.alertaId, r.resendId, momento);
      if (r.simulado) simulados++;
      else enviados++;
    } catch (erro) {
      // Falha de envio não entra em retry infinito — queima reputação de domínio.
      await marcarFalhou(p.alertaId, erro instanceof Error ? erro.message : "erro de envio");
      log.error("alerta.falha_envio", { alertaId: p.alertaId });
      falhas++;
    }
  }

  return { pendentes: pendentes.length, enviados, simulados, falhas };
}
