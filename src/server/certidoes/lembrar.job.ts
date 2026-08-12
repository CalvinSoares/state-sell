import "server-only";
import { env } from "@/src/env";
import { log } from "@/src/server/log";
import { TIPO_POR_SLUG } from "@/src/shared/config/certidoes";
import {
  candidatasLembreteCertidao,
  marcarLembreteCertidao,
} from "@/src/server/db/repositorios/certidao.repo";
import { enviarEmailBruto } from "@/src/server/alerta/enviar.action";
import { lembreteDevido } from "./status";

export type ResultadoLembreteCertidao = {
  candidatas: number;
  enviados: number;
  simulados: number;
  falhas: number;
};

function hojeYmd(agora: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(agora); // YYYY-MM-DD
}

function formatarDataBr(ymd: string): string {
  const [a, m, d] = ymd.split("-");
  return `${d}/${m}/${a}`;
}

/**
 * Lembretes D-15 e D-3 do cofre. Não afirma que a certidão está válida —
 * só lembra a data que a pessoa informou. Idempotente via lembrete_*_em.
 */
export async function lembrarCertidoesJob(
  agora: () => Date = () => new Date(),
): Promise<ResultadoLembreteCertidao> {
  const momento = agora();
  const hoje = hojeYmd(momento);
  const candidatas = await candidatasLembreteCertidao(hoje);

  let enviados = 0;
  let simulados = 0;
  let falhas = 0;

  for (const c of candidatas) {
    const qual = lembreteDevido(c.vencimentoEm, momento, Boolean(c.lembrete15Em), Boolean(c.lembrete3Em));
    if (!qual) continue;

    const meta = TIPO_POR_SLUG.get(c.tipo as never);
    const rotulo = meta?.rotulo ?? c.tipo;
    const dias = qual === "d15" ? "15 dias" : "3 dias";
    const dataBr = formatarDataBr(c.vencimentoEm);
    const urlCofre = `${env.NEXT_PUBLIC_APP_URL}/certidoes`;

    const assunto =
      qual === "d15"
        ? `Lembrete: a data da sua ${rotulo} vence em cerca de 15 dias`
        : `Lembrete: a data da sua ${rotulo} vence em cerca de 3 dias`;

    const texto = [
      `Você informou que sua ${rotulo} vence em ${dataBr}.`,
      `Pela contagem do calendário, faltam cerca de ${dias}.`,
      "",
      "Isso não significa que o órgão ainda considera o documento válido — a verdade está no emissor.",
      "Se ainda não renovou, vale olhar com calma agora.",
      "",
      `Ver seu cofre: ${urlCofre}`,
      `Como tirar de novo: ${env.NEXT_PUBLIC_APP_URL}/trilha`,
    ].join("\n");

    const html = `
      <p>Você informou que sua <strong>${escapar(rotulo)}</strong> vence em <strong>${escapar(dataBr)}</strong>.</p>
      <p>Pela contagem do calendário, faltam cerca de <strong>${dias}</strong>.</p>
      <p style="color:#6b6a63">Isso não significa que o órgão ainda considera o documento válido — a verdade está no emissor. Se ainda não renovou, vale olhar com calma agora.</p>
      <p><a href="${escapar(urlCofre)}">Ver seu cofre</a> · <a href="${escapar(env.NEXT_PUBLIC_APP_URL)}/trilha">Como renovar</a></p>
    `;

    try {
      // Marca antes do envio para não spammar se o provedor falhar no meio —
      // igual ao lembrete de prazo do alerta (claim-first).
      await marcarLembreteCertidao(c.id, qual, momento);
      const r = await enviarEmailBruto(c.email, assunto, html, texto);
      if (r.simulado) simulados++;
      else enviados++;
    } catch (e) {
      log.error("certidao.lembrete.falha", {
        certidaoId: c.id,
        erro: e instanceof Error ? e.message : String(e),
      });
      falhas++;
    }
  }

  return { candidatas: candidatas.length, enviados, simulados, falhas };
}

function escapar(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
