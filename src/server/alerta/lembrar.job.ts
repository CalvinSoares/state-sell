import "server-only";
import { env } from "@/src/env";
import { RAMOS_POR_SLUG } from "@/content/ramos";
import { log } from "@/src/server/log";
import { assinarValor } from "@/src/server/auth/token";
import { marcarFalhou, reivindicarParaLembrete } from "@/src/server/db/repositorios/alerta.repo";
import { comporEmail } from "./compor";
import { enviarEmailAlerta } from "./enviar.action";

// Janela do lembrete: prazo caindo em até 36h. Com o tick diário, isso pega o
// "acaba amanhã" de forma confiável sem lembrar cedo demais.
const JANELA_LEMBRETE_MS = 36 * 60 * 60 * 1000;
const VALIDADE_DESCADASTRO_MS = 365 * 24 * 60 * 60 * 1000;

export type ResultadoLembrar = { candidatos: number; enviados: number; simulados: number; falhas: number };

async function urlDescadastro(email: string, agoraMs: number): Promise<string | undefined> {
  if (!env.AUTH_SECRET) return undefined;
  const token = await assinarValor(email, env.AUTH_SECRET, agoraMs, VALIDADE_DESCADASTRO_MS);
  return `${env.NEXT_PUBLIC_APP_URL}/descadastrar?t=${encodeURIComponent(token)}`;
}

/**
 * Lembrete D-1: avisa quem já recebeu o alerta que o prazo está fechando.
 * Reivindica atomicamente (marca lembrado_em), então nunca lembra duas vezes.
 */
export async function lembrarJob(agora: () => Date = () => new Date()): Promise<ResultadoLembrar> {
  const momento = agora();
  const claimados = await reivindicarParaLembrete(momento, JANELA_LEMBRETE_MS);
  let enviados = 0;
  let simulados = 0;
  let falhas = 0;

  for (const p of claimados) {
    const ramo = RAMOS_POR_SLUG.get(p.ramoSlug);
    if (!ramo || !p.dataEncerramentoProposta) {
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
      undefined,
      await urlDescadastro(p.email, momento.getTime()),
      true, // lembrete
    );

    try {
      const r = await enviarEmailAlerta(p.email, email);
      if (r.simulado) simulados++;
      else enviados++;
    } catch {
      // Já marcamos lembrado_em no claim; um erro aqui só perde este lembrete.
      log.error("lembrete.falha_envio", { alertaId: p.alertaId });
      falhas++;
    }
  }

  return { candidatos: claimados.length, enviados, simulados, falhas };
}
