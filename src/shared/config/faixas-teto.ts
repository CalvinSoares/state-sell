/**
 * Faixas de teto do cadastro, em linguagem de gente. O valor é o maior contrato
 * que a estrutura entrega — protege contra ganhar o que não consegue cumprir.
 * Ver cadastro-do-assinante.md.
 */
export const FAIXAS_TETO = [
  { valor: "ate5k", rotulo: "até R$ 5 mil", centavos: 500_000n },
  { valor: "ate20k", rotulo: "até R$ 20 mil", centavos: 2_000_000n },
  { valor: "ate50k", rotulo: "até R$ 50 mil", centavos: 5_000_000n },
  { valor: "acima", rotulo: "acima disso", centavos: null },
] as const;

export type FaixaTeto = (typeof FAIXAS_TETO)[number]["valor"];

export function tetoParaCentavos(faixa: FaixaTeto): bigint | null {
  return FAIXAS_TETO.find((f) => f.valor === faixa)?.centavos ?? null;
}
