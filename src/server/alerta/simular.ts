/**
 * Simulação histórica: "com este perfil, o que teria virado alerta".
 * PURO — avalia cada contratação no momento em que a coletamos (não em "agora"),
 * para o prazo de 24h e a situação ainda fazerem sentido.
 */
import {
  selecionarPara,
  type ContratacaoParaSelecao,
  type PerfilAssinante,
  type Selecao,
} from "./selecionar";

export type ContratacaoHistorica = ContratacaoParaSelecao & {
  coletadoEm: Date;
  orgaoRazaoSocial: string;
  municipioNome: string;
  itemDescricaoPorId: Record<string, string>;
};

export type ResultadoSimulacao = Selecao & {
  orgaoRazaoSocial: string;
  municipioNome: string;
  itemDescricao: string;
  valorTotalEstimadoCentavos: bigint | null;
};

/**
 * Para cada contratação coletada na janela, avalia como se o job de alertar
 * tivesse rodado em `coletadoEm`. Força situacao=1 porque o estado atual pode
 * já estar encerrado — na coleta ela estava divulgada.
 */
export function simularHistorico(
  candidatas: ContratacaoHistorica[],
  perfil: PerfilAssinante,
): ResultadoSimulacao[] {
  const out: ResultadoSimulacao[] = [];

  for (const c of candidatas) {
    const paraSelecao: ContratacaoParaSelecao = {
      contratacaoId: c.contratacaoId,
      codigoIbge: c.codigoIbge,
      uf: c.uf,
      valorTotalEstimadoCentavos: c.valorTotalEstimadoCentavos,
      situacaoCompraId: 1,
      dataEncerramentoProposta: c.dataEncerramentoProposta,
      itens: c.itens,
    };
    const sel = selecionarPara(paraSelecao, perfil, c.coletadoEm);
    if (!sel) continue;
    out.push({
      ...sel,
      orgaoRazaoSocial: c.orgaoRazaoSocial,
      municipioNome: c.municipioNome,
      itemDescricao: c.itemDescricaoPorId[sel.itemIdPrincipal] ?? "",
      valorTotalEstimadoCentavos: c.valorTotalEstimadoCentavos,
    });
  }

  out.sort((a, b) => a.prioridade - b.prioridade);
  return out;
}
