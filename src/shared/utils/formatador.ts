/**
 * Formatação de moeda para o e-mail. Puro.
 * O e-mail usa valor aproximado ("por volta de R$ 38 mil"), nunca centavos
 * exatos — decidível em trinta segundos. Ver alertas-e-envio.md.
 */

/** centavos → reais (number). Só para exibição; regra financeira fica no backend. */
function centavosParaReais(centavos: bigint): number {
  return Number(centavos) / 100;
}

/**
 * "por volta de R$ 38 mil" / "por volta de R$ 9,3 mil" / "R$ 850" / "R$ 1,2 milhão".
 * Arredonda para uma casa significativa amigável.
 */
export function valorAproximado(centavos: bigint | null): string | null {
  if (centavos == null) return null;
  const reais = centavosParaReais(centavos);
  if (reais <= 0) return null;

  if (reais >= 1_000_000) {
    const milhoes = reais / 1_000_000;
    return `por volta de R$ ${formatarNumero(milhoes)} ${milhoes >= 2 ? "milhões" : "milhão"}`;
  }
  if (reais >= 10_000) {
    return `por volta de R$ ${Math.round(reais / 1000)} mil`;
  }
  if (reais >= 1_000) {
    return `por volta de R$ ${formatarNumero(reais / 1000)} mil`;
  }
  return `cerca de R$ ${Math.round(reais)}`;
}

function formatarNumero(n: number): string {
  // uma casa decimal quando ajuda, sem zero à toa
  const arred = Math.round(n * 10) / 10;
  return Number.isInteger(arred) ? String(arred) : arred.toFixed(1).replace(".", ",");
}

/** "400 refeições" / "1.250 maço" — quantidade + unidade para o e-mail. */
export function quantidadeTexto(quantidade: number | null, unidade: string | null): string | null {
  if (quantidade == null) return null;
  const q = Number.isInteger(quantidade)
    ? quantidade.toLocaleString("pt-BR")
    : quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return unidade ? `${q} ${unidade}` : q;
}
