/**
 * Métricas do casamento contra o conjunto rotulado. Puro.
 * Precisão é gate; recall é relatório. A assimetria é deliberada:
 * alerta perdido a pessoa não percebe; alerta errado faz ela cancelar.
 */
import type { Ramo } from "@/src/shared/types/ramo";
import { melhorRamo } from "./casar";
import type { ItemRotulado } from "./fixtures";

export type MetricaRamo = {
  ramo: string;
  verdadeirosPositivos: number;
  falsosPositivos: number;
  falsosNegativos: number;
  precisao: number;
  recall: number;
  /** falsos positivos com o texto original — sem isso não dá para corrigir */
  exemplosFalsosPositivos: { descricaoItem: string; objetoCompra: string; ramoEsperado: string | null }[];
};

function taxa(numerador: number, denominador: number): number {
  return denominador === 0 ? 1 : numerador / denominador;
}

/**
 * Avalia um ramo. Se `apenasAmostraAleatoria`, considera só os itens marcados
 * como origemAmostra="aleatoria" — é essa a métrica que vale como gate,
 * porque rotular só caso difícil produz precisão que não representa a realidade.
 */
export function avaliarRamo(
  ramo: Ramo,
  todosRamos: Ramo[],
  rotulados: ItemRotulado[],
  opts: { apenasAmostraAleatoria?: boolean } = {},
): MetricaRamo {
  const universo = opts.apenasAmostraAleatoria
    ? rotulados.filter((i) => i.origemAmostra === "aleatoria")
    : rotulados;

  let vp = 0;
  let fp = 0;
  let fn = 0;
  const exemplosFalsosPositivos: MetricaRamo["exemplosFalsosPositivos"] = [];

  for (const item of universo) {
    const previsto = melhorRamo(item, todosRamos)?.ramo ?? null;
    const esperado = item.ramoEsperado;

    const previuEste = previsto === ramo.slug;
    const eraEste = esperado === ramo.slug;

    if (previuEste && eraEste) vp++;
    else if (previuEste && !eraEste) {
      fp++;
      exemplosFalsosPositivos.push({
        descricaoItem: item.descricaoItem,
        objetoCompra: item.objetoCompra,
        ramoEsperado: esperado,
      });
    } else if (!previuEste && eraEste) fn++;
  }

  return {
    ramo: ramo.slug,
    verdadeirosPositivos: vp,
    falsosPositivos: fp,
    falsosNegativos: fn,
    precisao: taxa(vp, vp + fp),
    recall: taxa(vp, vp + fn),
    exemplosFalsosPositivos,
  };
}
