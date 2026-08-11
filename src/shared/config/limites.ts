/**
 * ÚNICA fonte dos valores de corte legais.
 *
 * ⚠️ Estes valores mudam por lei e decreto. NUNCA espalhar como constante em
 * outro arquivo. Ao atualizar, trocar aqui e registrar a norma e a data abaixo.
 *
 * Ver: docs/base-de-conhecimentos/regras-sistemicas-ia.md (invariante "Legal")
 *      docs/base-de-conhecimentos/contexto-produto.md (o detalhe que faz o mercado existir)
 */

export type LimiteLegal = {
  /** valor em centavos */
  valorCentavos: number;
  /** norma que fixa o valor */
  norma: string;
  /** data em que este valor foi conferido contra a norma vigente (AAAA-MM-DD) */
  conferidoEm: string;
};

/**
 * Teto da dispensa de licitação por valor (bens/serviços comuns).
 * Ordem de grandeza — CONFERIR o vigente antes de usar como regra dura.
 * Lei 14.133/2021, art. 75, II, atualizado por decreto.
 */
export const TETO_DISPENSA_VALOR: LimiteLegal = {
  valorCentavos: 5_900_000, // ~R$ 59.000 — PLACEHOLDER, conferir decreto vigente
  norma: "Lei 14.133/2021, art. 75, II (valor atualizado por decreto)",
  conferidoEm: "0000-00-00", // ⚠️ ainda não conferido — não usar como gate sem confirmar
};

/**
 * Teto para exclusividade de participação de ME/EPP.
 * LC 123/2006, art. 48, I. Ordem de grandeza na casa dos R$ 80 mil.
 */
export const TETO_EXCLUSIVIDADE_ME_EPP: LimiteLegal = {
  valorCentavos: 8_000_000, // ~R$ 80.000 — PLACEHOLDER, conferir norma vigente
  norma: "LC 123/2006, art. 48, I",
  conferidoEm: "0000-00-00", // ⚠️ ainda não conferido
};

/**
 * A verificação empírica (dados/verificacao-de-viabilidade.md) mostrou que a
 * exclusividade ME/EPP vem CARIMBADA no item (campo tipoBeneficio do PNCP).
 * Portanto NÃO inferimos exclusividade a partir do valor — usamos o campo.
 * Estes tetos servem para: filtro de teto do assinante e trilha educativa,
 * nunca para deduzir benefício.
 */
