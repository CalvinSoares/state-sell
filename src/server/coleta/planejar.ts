/**
 * Decisões puras do job de coleta — sem I/O, testáveis.
 * Ver docs/base-de-conhecimentos/backend-contexto/coleta-e-jobs.md
 */
import { MODALIDADE } from "@/src/server/pncp/schemas";

/** Combinação (uf, modalidade) que o job percorre. */
export type Combinacao = { uf: string; modalidadeId: number };

/** chave do cursor: "SP:8". */
export function chaveCursor(c: Combinacao): string {
  return `${c.uf}:${c.modalidadeId}`;
}

export function parseChaveCursor(chave: string): Combinacao {
  const [uf, modalidade] = chave.split(":");
  return { uf: uf ?? "", modalidadeId: Number(modalidade) };
}

/**
 * Ordena as combinações por cursor mais antigo primeiro, para que nenhuma UF
 * fique sem coleta porque outra é grande demais. Combinação sem cursor (nunca
 * coletada) vem primeiro. Puro: recebe o mapa de "atualizadoEm" por chave.
 */
export function ordenarPorMaisAntigo(
  combinacoes: Combinacao[],
  atualizadoPorChave: ReadonlyMap<string, number>,
): Combinacao[] {
  return [...combinacoes].sort((a, b) => {
    const ta = atualizadoPorChave.get(chaveCursor(a)) ?? 0; // 0 = nunca coletado → primeiro
    const tb = atualizadoPorChave.get(chaveCursor(b)) ?? 0;
    return ta - tb;
  });
}

/** Orçamento de tempo do job. 300s de teto na Vercel, com margem de segurança. */
export const ORCAMENTO_MS = 240_000;

export function fezOrcamento(inicioMs: number, agoraMs: number): boolean {
  return agoraMs - inicioMs >= ORCAMENTO_MS;
}

/**
 * Próximo estado do cursor após processar uma página.
 * Se não sobram páginas, volta para 1 (o ciclo recomeça na próxima execução).
 */
export function proximoCursor(
  paginaAtual: number,
  paginasRestantes: number,
): { ultimaPagina: number } {
  return { ultimaPagina: paginasRestantes > 0 ? paginaAtual + 1 : 1 };
}

/** Formata um Date como AAAAMMDD (UTC). */
export function formatarDataFinal(d: Date): string {
  const ano = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(d.getUTCDate()).padStart(2, "0");
  return `${ano}${mes}${dia}`;
}

/**
 * Horizonte de dias à frente para o `dataFinal` da consulta. O parâmetro é um
 * teto na data de encerramento da proposta — precisa estar no FUTURO para
 * capturar a janela aberta inteira. Janela mediana ~6d, máx observado 64d;
 * 90 dias cobre com folga. Ver verificacao-de-viabilidade.md.
 */
export const HORIZONTE_DIAS = 90;

/** dataFinal = agora + HORIZONTE_DIAS, em AAAAMMDD. */
export function dataFinalHorizonte(agoraMs: number): string {
  return formatarDataFinal(new Date(agoraMs + HORIZONTE_DIAS * 24 * 60 * 60 * 1000));
}

/**
 * Combinações padrão do v1. UFs de maior volume + modalidades de interesse.
 * Ampliar conforme a cobertura for verificada fora do Sudeste
 * (ver dados/verificacao-de-viabilidade.md — item pendente).
 */
export const UFS_V1 = ["SP", "MG", "RJ", "PR", "RS", "BA", "SC", "GO"] as const;

export function combinacoesPadrao(): Combinacao[] {
  const combos: Combinacao[] = [];
  for (const uf of UFS_V1) {
    combos.push({ uf, modalidadeId: MODALIDADE.dispensa });
    combos.push({ uf, modalidadeId: MODALIDADE.pregaoEletronico });
  }
  return combos;
}
