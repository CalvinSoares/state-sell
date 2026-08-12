/**
 * Situação do cofre — PURO. A data de vencimento é a que a pessoa informou;
 * nunca afirmamos que o órgão ainda considera válida. Ver cofre-de-certidoes.md.
 */

export type SituacaoCertidao = "ok" | "atencao" | "vencida";

/** Dias de calendário (pode ser negativo se já passou). */
export function diasAteVencimento(vencimentoYmd: string, agora: Date, tz = "America/Sao_Paulo"): number {
  const [ano, mes, dia] = vencimentoYmd.split("-").map(Number);
  if (!ano || !mes || !dia) return Number.NaN;

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const partes = Object.fromEntries(fmt.formatToParts(agora).map((p) => [p.type, p.value]));
  const hojeOrdinal = Math.floor(
    Date.UTC(Number(partes.year), Number(partes.month) - 1, Number(partes.day)) / 86_400_000,
  );
  const vencOrdinal = Math.floor(Date.UTC(ano, mes - 1, dia) / 86_400_000);
  return vencOrdinal - hojeOrdinal;
}

export function situacaoCertidao(vencimentoYmd: string, agora: Date): SituacaoCertidao {
  const dias = diasAteVencimento(vencimentoYmd, agora);
  if (Number.isNaN(dias) || dias < 0) return "vencida";
  if (dias <= 15) return "atencao";
  return "ok";
}

export type LembreteDue = "d15" | "d3" | null;

/**
 * Qual lembrete enviar hoje (cron diário). Idempotente via flags no banco.
 * - D-15: faltam entre 4 e 15 dias (inclusive), ainda não mandou d15
 * - D-3: faltam entre 0 e 3 dias (inclusive), ainda não mandou d3
 * Não manda e-mail se já venceu.
 */
export function lembreteDevido(
  vencimentoYmd: string,
  agora: Date,
  jaD15: boolean,
  jaD3: boolean,
): LembreteDue {
  const dias = diasAteVencimento(vencimentoYmd, agora);
  if (Number.isNaN(dias) || dias < 0) return null;
  if (dias <= 3 && !jaD3) return "d3";
  if (dias <= 15 && dias > 3 && !jaD15) return "d15";
  return null;
}

export function rotuloSituacao(s: SituacaoCertidao): string {
  if (s === "ok") return "Em dia";
  if (s === "atencao") return "Vence em breve";
  return "Vencida (pela data que você informou)";
}
