import "server-only";
import { consultarContratacoesAbertas, consultarItens, PncpContratoError } from "@/src/server/pncp/cliente";
import { SITUACAO_DIVULGADA } from "@/src/server/pncp/schemas";
import { mapearContratacao, mapearItem } from "@/src/server/pncp/mapeadores";
import { upsertContratacao, upsertItens } from "@/src/server/db/repositorios/contratacao.repo";
import {
  carregarCursores,
  finalizarExecucao,
  iniciarExecucao,
  lerCursor,
  salvarCursor,
} from "@/src/server/db/repositorios/coleta.repo";
import { comConcorrencia } from "./concorrencia";
import {
  chaveCursor,
  combinacoesPadrao,
  fezOrcamento,
  formatarDataFinal,
  ordenarPorMaisAntigo,
  proximoCursor,
  type Combinacao,
} from "./planejar";

const CONCORRENCIA_ITENS = 5;

export type ResultadoColeta = {
  combinacoesProcessadas: number;
  paginasLidas: number;
  novas: number;
  atualizadas: number;
  erros: number;
  interrompidoPorTempo: boolean;
};

/**
 * Coleta contratações abertas e seus itens. Idempotente, dirigida por cursor,
 * limitada por orçamento de tempo. Ver coleta-e-jobs.md.
 */
export async function coletarJob(agora: () => number = Date.now): Promise<ResultadoColeta> {
  const inicio = agora();
  const cursores = await carregarCursores();
  const combinacoes = ordenarPorMaisAntigo(combinacoesPadrao(), cursores);
  const dataFinal = formatarDataFinal(new Date(inicio));

  const total: ResultadoColeta = {
    combinacoesProcessadas: 0,
    paginasLidas: 0,
    novas: 0,
    atualizadas: 0,
    erros: 0,
    interrompidoPorTempo: false,
  };

  for (const combo of combinacoes) {
    if (fezOrcamento(inicio, agora())) {
      total.interrompidoPorTempo = true;
      break;
    }
    await processarCombinacao(combo, dataFinal, total, () => fezOrcamento(inicio, agora()));
    total.combinacoesProcessadas++;
  }

  return total;
}

async function processarCombinacao(
  combo: Combinacao,
  dataFinal: string,
  total: ResultadoColeta,
  estourou: () => boolean,
): Promise<void> {
  const chave = chaveCursor(combo);
  const execucaoId = await iniciarExecucao(combo.uf, combo.modalidadeId);
  let paginasLidas = 0;
  let novas = 0;
  let atualizadas = 0;
  let erros = 0;

  try {
    const pagina = await lerCursor(chave);
    const envelope = await consultarContratacoesAbertas({
      dataFinal,
      codigoModalidadeContratacao: combo.modalidadeId,
      pagina,
    });
    paginasLidas++;

    // Só o que está divulgado gera alerta — descartamos o resto na coleta.
    const divulgadas = envelope.data.filter((c) => c.situacaoCompraId === SITUACAO_DIVULGADA);

    for (const bruta of divulgadas) {
      if (estourou()) break;
      const c = mapearContratacao(bruta);
      const { id, nova } = await upsertContratacao(c);
      if (nova) novas++;
      else atualizadas++;

      // O N+1 dos itens só se paga em contratação nova.
      if (nova) {
        const itensBrutos = await consultarItens(c.cnpjOrgao, c.ano, c.sequencial);
        await upsertItens(id, itensBrutos.map(mapearItem));
      }
    }

    await salvarCursor(chave, proximoCursor(pagina, envelope.paginasRestantes).ultimaPagina, dataFinal);
    await finalizarExecucao(execucaoId, { paginasLidas, novas, atualizadas, erros, status: "ok" });
  } catch (erro) {
    erros++;
    // Falha de contrato deve ser visível — o payload fica no erro para diagnóstico.
    const status = erro instanceof PncpContratoError ? "falhou_contrato" : "falhou";
    await finalizarExecucao(execucaoId, { paginasLidas, novas, atualizadas, erros, status });
    // Não relança: uma combinação com erro não derruba as outras.
  } finally {
    total.paginasLidas += paginasLidas;
    total.novas += novas;
    total.atualizadas += atualizadas;
    total.erros += erros;
  }
}
