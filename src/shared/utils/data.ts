/**
 * Utils de data em pt-BR. Puros — recebem `agora` por parâmetro, nunca leem
 * o relógio internamente (testabilidade e reprodutibilidade).
 * Timezone de exibição: America/Sao_Paulo. Ver fluxos-criticos.md (P1).
 */

const TZ = "America/Sao_Paulo";

const DIAS_SEMANA = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
] as const;

/** Partes de uma data no fuso de São Paulo, sem depender do fuso do servidor. */
function partesSaoPaulo(d: Date): { ano: number; mes: number; dia: number; hora: number; minuto: number; diaSemana: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const partes = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  const mapaDia: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    ano: Number(partes.year),
    mes: Number(partes.month),
    dia: Number(partes.day),
    hora: Number(partes.hour === "24" ? "0" : partes.hour),
    minuto: Number(partes.minute),
    diaSemana: mapaDia[partes.weekday ?? "Sun"] ?? 0,
  };
}

/** Dias corridos (blocos de 24h) entre agora e uma data futura, mínimo 0. */
export function diasRestantes(prazo: Date, agora: Date): number {
  const ms = prazo.getTime() - agora.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/** Número ordinal do dia no calendário de São Paulo (para diferença de datas). */
function ordinalDoDia(d: Date): number {
  const p = partesSaoPaulo(d);
  return Math.floor(Date.UTC(p.ano, p.mes - 1, p.dia) / (1000 * 60 * 60 * 24));
}

/**
 * Diferença em dias de CALENDÁRIO no fuso de São Paulo. Terça → sexta = 3.
 * É a contagem que soa natural para a pessoa ("faltam 3 dias"), diferente de
 * blocos de 24h. Usada só para exibição.
 */
export function diasCalendario(prazo: Date, agora: Date): number {
  return Math.max(0, ordinalDoDia(prazo) - ordinalDoDia(agora));
}

/** Horas restantes até o prazo (para o corte de 24h). */
export function horasRestantes(prazo: Date, agora: Date): number {
  return (prazo.getTime() - agora.getTime()) / (1000 * 60 * 60);
}

/**
 * "quinta, 14/08 às 9h — faltam 3 dias" (ou "faltam poucas horas" / "é hoje").
 * Prazo e agora são instantes; a exibição usa o fuso de São Paulo.
 */
export function prazoTexto(prazo: Date, agora: Date): string {
  const p = partesSaoPaulo(prazo);
  const dia = DIAS_SEMANA[p.diaSemana];
  const data = `${String(p.dia).padStart(2, "0")}/${String(p.mes).padStart(2, "0")}`;
  const hora = p.minuto === 0 ? `${p.hora}h` : `${p.hora}h${String(p.minuto).padStart(2, "0")}`;

  const dias = diasCalendario(prazo, agora);
  const horas = horasRestantes(prazo, agora);
  let restante: string;
  if (horas <= 0) restante = "o prazo está encerrando";
  else if (dias === 0) restante = "faltam poucas horas";
  else if (dias === 1) restante = "falta 1 dia";
  else restante = `faltam ${dias} dias`;

  return `${dia}, ${data} às ${hora} — ${restante}`;
}
