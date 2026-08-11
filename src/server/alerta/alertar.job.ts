import "server-only";
import {
  alertasCriadosDesde,
  assinantesAtivosComPerfil,
  contratacoesCandidatas,
  criarAlertasPendentes,
  paresAlertados,
} from "@/src/server/db/repositorios/alerta.repo";
import { distribuirTetoDiario, selecionarPara, type Selecao } from "./selecionar";

const JANELA_TETO_MS = 24 * 60 * 60 * 1000;

export type ResultadoAlertar = {
  assinantes: number;
  contratacoes: number;
  selecionados: number;
  novos: number;
  criados: number;
  adiados: number;
};

/**
 * Decide quem recebe o quê e cria alertas pendentes. Não envia.
 * O teto diário desconta o que já foi criado nas últimas 24h e exclui pares já
 * alertados, para o excedente eventualmente sair (auditoria #6).
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

  // Exclui o que já virou alerta (senão ocuparia as vagas do teto à toa).
  const jaAlertado = await paresAlertados(perfis.map((p) => p.assinanteId));
  const novas = selecoes.filter((s) => !jaAlertado.has(`${s.assinanteId}:${s.contratacaoId}`));

  const criados24h = await alertasCriadosDesde(new Date(momento.getTime() - JANELA_TETO_MS));
  const { enviarAgora, adiar } = distribuirTetoDiario(novas, criados24h);

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
    novos: novas.length,
    criados,
    adiados: adiar.length,
  };
}
