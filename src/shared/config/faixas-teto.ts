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

/** Inverso de tetoParaCentavos — para pré-preencher o formulário de perfil. */
export function centavosParaFaixa(centavos: bigint | null | undefined): FaixaTeto {
  if (centavos == null) return "acima";
  const exata = FAIXAS_TETO.find((f) => f.centavos === centavos);
  if (exata) return exata.valor;
  // fallback: menor faixa que ainda cobre o valor
  for (const f of FAIXAS_TETO) {
    if (f.centavos != null && centavos <= f.centavos) return f.valor;
  }
  return "acima";
}
