import "server-only";
import {
  assinantesAtivosComPerfil,
  contratacoesCandidatas,
  criarAlertasPendentes,
} from "@/src/server/db/repositorios/alerta.repo";
import { aplicarTetoDiario, selecionarPara, type Selecao } from "./selecionar";

export type ResultadoAlertar = {
  assinantes: number;
  contratacoes: number;
  selecionados: number;
  criados: number;
  adiados: number;
};

/**
 * Decide quem recebe o quê e cria alertas pendentes. Não envia.
 * A seleção é pura (selecionar.ts); aqui é só orquestração de I/O.
 */
export async function alertarJob(agora: () => Date = () => new Date()): Promise<ResultadoAlertar> {
  const momento = agora();
  const [perfis, candidatas] = await Promise.all([
    assinantesAtivosComPerfil(),
    contratacoesCandidatas(momento),
  ]);

  const selecoes: Selecao[] = [];
  for (const perfil of perfis) {
    for (const c of candidatas) {
      const s = selecionarPara(c, perfil, momento);
      if (s) selecoes.push(s);
    }
  }

  const { enviarAgora, adiar } = aplicarTetoDiario(selecoes);

  const criados = await criarAlertasPendentes(
    enviarAgora.map((s) => ({
      assinanteId: s.assinanteId,
      contratacaoId: s.contratacaoId,
      ramoSlug: s.ramoSlug,
      itemIdPrincipal: s.itemIdPrincipal,
    })),
  );

  return {
    assinantes: perfis.length,
    contratacoes: candidatas.length,
    selecionados: selecoes.length,
    criados,
    adiados: adiar.length,
  };
}
