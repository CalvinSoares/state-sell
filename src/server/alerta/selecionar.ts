/**
 * Quem recebe o quê. PURO — recebe dados e `agora` por parâmetro.
 * Casamento diz "é deste ramo"; aqui decidimos "serve para esta pessoa".
 * Ver docs/base-de-conhecimentos/regras-de-negocio/casamento.md (filtros)
 *     e alertas-e-envio.md (deduplicação e volume).
 */
import { horasRestantes } from "@/src/shared/utils/data";

/** Corte mínimo de prazo: alerta sem tempo de agir é pior que nenhum. */
export const HORAS_MINIMAS = 24;

/** Teto diário de alertas por assinante. Caixa inundada = spam. */
export const MAX_ALERTAS_DIA = 5;

const SITUACAO_DIVULGADA = 1;

export type ItemClassificado = {
  itemId: string;
  ramoSlug: string;
  score: number;
  valorTotalCentavos: bigint | null;
  exclusivoMeEpp: boolean;
};

export type ContratacaoParaSelecao = {
  contratacaoId: string;
  codigoIbge: string;
  uf: string;
  valorTotalEstimadoCentavos: bigint | null;
  situacaoCompraId: number;
  dataEncerramentoProposta: Date | null;
  itens: ItemClassificado[];
};

export type PerfilAssinante = {
  assinanteId: string;
  ramos: string[];
  /** vazio = estado inteiro (compara por uf) */
  municipiosIbge: string[];
  uf: string | null;
  tetoValorCentavos: bigint | null;
};

export type Selecao = {
  assinanteId: string;
  contratacaoId: string;
  ramoSlug: string;
  itemIdPrincipal: string;
  exclusivoMeEpp: boolean;
  /** prioridade para o teto diário: menor = mais importante */
  prioridade: number;
  dataEncerramentoProposta: Date;
};

function geograficoBate(c: ContratacaoParaSelecao, p: PerfilAssinante): boolean {
  if (p.municipiosIbge.length > 0) return p.municipiosIbge.includes(c.codigoIbge);
  if (p.uf) return c.uf === p.uf; // plano estado inteiro
  return false;
}

function dentroDoTeto(valor: bigint | null, teto: bigint | null): boolean {
  if (teto == null) return true; // sem teto declarado: não barra
  if (valor == null) return true; // valor desconhecido: não inventa; deixa passar
  return valor <= teto;
}

/**
 * Escolhe o item que representa a contratação no alerta: prioriza exclusivo
 * ME/EPP, depois maior valor, depois maior score. Determinístico.
 */
export function escolherItemPrincipal(itens: ItemClassificado[]): ItemClassificado | null {
  if (itens.length === 0) return null;
  return [...itens].sort((a, b) => {
    if (a.exclusivoMeEpp !== b.exclusivoMeEpp) return a.exclusivoMeEpp ? -1 : 1;
    const va = a.valorTotalCentavos ?? 0n;
    const vb = b.valorTotalCentavos ?? 0n;
    if (va !== vb) return vb > va ? 1 : -1;
    return b.score - a.score;
  })[0]!;
}

/**
 * Uma contratação vira (ou não) uma seleção para um assinante.
 * Retorna null quando algum filtro barra.
 */
export function selecionarPara(
  c: ContratacaoParaSelecao,
  p: PerfilAssinante,
  agora: Date,
): Selecao | null {
  if (c.situacaoCompraId !== SITUACAO_DIVULGADA) return null;
  if (!c.dataEncerramentoProposta) return null;
  if (horasRestantes(c.dataEncerramentoProposta, agora) < HORAS_MINIMAS) return null;
  if (!geograficoBate(c, p)) return null;
  if (!dentroDoTeto(c.valorTotalEstimadoCentavos, p.tetoValorCentavos)) return null;

  // itens do ramo do perfil, dentro do teto individual
  const doRamo = c.itens.filter(
    (i) => p.ramos.includes(i.ramoSlug) && dentroDoTeto(i.valorTotalCentavos, p.tetoValorCentavos),
  );
  const principal = escolherItemPrincipal(doRamo);
  if (!principal) return null;

  return {
    assinanteId: p.assinanteId,
    contratacaoId: c.contratacaoId,
    ramoSlug: principal.ramoSlug,
    itemIdPrincipal: principal.itemId,
    exclusivoMeEpp: principal.exclusivoMeEpp,
    // prioridade: exclusivo ME/EPP primeiro, depois prazo mais curto
    prioridade:
      (principal.exclusivoMeEpp ? 0 : 1000) +
      Math.min(999, Math.floor(horasRestantes(c.dataEncerramentoProposta, agora))),
    dataEncerramentoProposta: c.dataEncerramentoProposta,
  };
}

/**
 * Aplica o teto diário por assinante, ordenando por prioridade.
 * O excedente NÃO é descartado — fica de fora desta leva (o chamador o guarda
 * como pendente para o dia seguinte). Retorna { enviarAgora, adiar }.
 */
export function aplicarTetoDiario(selecoes: Selecao[]): {
  enviarAgora: Selecao[];
  adiar: Selecao[];
} {
  const porAssinante = new Map<string, Selecao[]>();
  for (const s of selecoes) {
    const lista = porAssinante.get(s.assinanteId) ?? [];
    lista.push(s);
    porAssinante.set(s.assinanteId, lista);
  }

  const enviarAgora: Selecao[] = [];
  const adiar: Selecao[] = [];
  for (const lista of porAssinante.values()) {
    lista.sort((a, b) => a.prioridade - b.prioridade);
    enviarAgora.push(...lista.slice(0, MAX_ALERTAS_DIA));
    adiar.push(...lista.slice(MAX_ALERTAS_DIA));
  }
  return { enviarAgora, adiar };
}
