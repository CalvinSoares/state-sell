import "server-only";
import { RAMOS } from "@/content/ramos";
import { VERSAO_CATALOGO } from "@/src/shared/types/ramo";
import { melhorRamo } from "@/src/server/casamento/casar";
import {
  gravarClassificacoes,
  itensSemClassificacao,
  type ClassificacaoNova,
} from "@/src/server/db/repositorios/classificacao.repo";
import { fezOrcamento } from "./planejar";

/**
 * Sentinela para item que não casa com nenhum ramo. Marca o item como já
 * processado nesta versão do catálogo, para não reprocessar a cada execução.
 * A seleção de alertas ignora este slug.
 */
export const RAMO_SEM_CLASSIFICACAO = "__sem_ramo__";

const TAMANHO_LOTE = 500;

export type ResultadoCasamento = {
  itensProcessados: number;
  classificados: number;
  semRamo: number;
  interrompidoPorTempo: boolean;
};

/** Classifica itens sem classificação na versão atual do catálogo. */
export async function casarJob(agora: () => number = Date.now): Promise<ResultadoCasamento> {
  const inicio = agora();
  const total: ResultadoCasamento = {
    itensProcessados: 0,
    classificados: 0,
    semRamo: 0,
    interrompidoPorTempo: false,
  };

  for (;;) {
    if (fezOrcamento(inicio, agora())) {
      total.interrompidoPorTempo = true;
      break;
    }

    const itens = await itensSemClassificacao(VERSAO_CATALOGO, TAMANHO_LOTE);
    if (itens.length === 0) break;

    const classificacoes: ClassificacaoNova[] = [];
    for (const item of itens) {
      const casamento = melhorRamo(
        {
          descricaoItem: item.descricao,
          objetoCompra: item.objetoCompra,
          informacaoComplementar: item.informacaoComplementar ?? undefined,
          unidadeMedida: item.unidadeMedida ?? undefined,
        },
        RAMOS,
      );

      if (casamento) {
        classificacoes.push({
          itemId: item.itemId,
          ramoSlug: casamento.ramo,
          score: casamento.score.toFixed(4),
          termosCasados: casamento.termosCasados,
          escala: casamento.escala,
        });
        total.classificados++;
      } else {
        classificacoes.push({
          itemId: item.itemId,
          ramoSlug: RAMO_SEM_CLASSIFICACAO,
          score: "0.0000",
          termosCasados: [],
          escala: false,
        });
        total.semRamo++;
      }
      total.itensProcessados++;
    }

    await gravarClassificacoes(VERSAO_CATALOGO, classificacoes);

    // Lote menor que o teto significa que acabaram os pendentes.
    if (itens.length < TAMANHO_LOTE) break;
  }

  return total;
}
