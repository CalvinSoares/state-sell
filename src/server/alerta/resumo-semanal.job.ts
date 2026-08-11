import "server-only";
import { municipioPorCodigo } from "@/src/server/ibge/municipios";
import { assinantesAtivosComPerfil, contratacoesCandidatas } from "@/src/server/db/repositorios/alerta.repo";
import {
  contarAlertasNaSemana,
  contarContratacoesNaRegiao,
  detalhesContratacoes,
} from "@/src/server/db/repositorios/resumo.repo";
import { emailPorAssinante } from "@/src/server/db/repositorios/assinante.repo";
import { RAMOS } from "@/content/ramos";
import { comporResumo, type OportunidadeAberta } from "./compor-resumo";
import { selecionarPara, type ContratacaoParaSelecao, type PerfilAssinante } from "./selecionar";
import { enviarEmailBruto } from "./enviar.action";
import { renderResumoHtml, renderResumoTexto } from "./render";

const UMA_SEMANA_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ABERTURAS = 3;

const ROTULO_POR_SLUG = new Map(RAMOS.map((r) => [r.slug, r.rotulo]));

export type ResultadoResumo = {
  assinantes: number;
  enviados: number;
  simulados: number;
  falhas: number;
};

/** Região em texto: cidade única ou "todo o estado de UF". */
function regiaoLabel(p: PerfilAssinante): string {
  if (p.municipiosIbge.length === 1) {
    return municipioPorCodigo(p.municipiosIbge[0]!)?.nome ?? "sua região";
  }
  if (p.municipiosIbge.length > 1) return "suas cidades";
  return p.uf ? `todo o estado de ${p.uf}` : "sua região";
}

/** Top-N contratações ainda abertas que servem para o assinante (não só as alertadas). */
function aberturasPara(
  candidatas: ContratacaoParaSelecao[],
  p: PerfilAssinante,
  agora: Date,
): { contratacaoId: string; ramoSlug: string }[] {
  const selecoes = candidatas
    .map((c) => selecionarPara(c, p, agora))
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => a.prioridade - b.prioridade)
    .slice(0, MAX_ABERTURAS);
  return selecoes.map((s) => ({ contratacaoId: s.contratacaoId, ramoSlug: s.ramoSlug }));
}

/** Resumo de sábado. Vai para TODOS os ativos, inclusive quem não recebeu nada. */
export async function resumoSemanalJob(agora: () => number = Date.now): Promise<ResultadoResumo> {
  const hoje = new Date(agora());
  const desde = new Date(agora() - UMA_SEMANA_MS);
  const perfis = await assinantesAtivosComPerfil();
  const candidatas = await contratacoesCandidatas(hoje);

  const total: ResultadoResumo = { assinantes: 0, enviados: 0, simulados: 0, falhas: 0 };

  for (const p of perfis) {
    total.assinantes++;
    const email = await emailPorAssinante(p.assinanteId);
    if (!email) continue;

    const [lidas, alertasSemana] = await Promise.all([
      contarContratacoesNaRegiao(p, desde),
      contarAlertasNaSemana(p.assinanteId, desde),
    ]);

    const idsAbertura = aberturasPara(candidatas, p, hoje);
    const mapaCandidata = new Map(candidatas.map((c) => [c.contratacaoId, c]));
    const detalhes = await detalhesContratacoes(idsAbertura.map((a) => a.contratacaoId));
    const aberturas: OportunidadeAberta[] = idsAbertura
      .map(({ contratacaoId, ramoSlug }) => {
        const c = mapaCandidata.get(contratacaoId);
        const d = detalhes.get(contratacaoId);
        if (!c?.dataEncerramentoProposta || !d) return null;
        return {
          orgaoRazaoSocial: d.orgaoRazaoSocial,
          municipioNome: d.municipioNome,
          ramoRotulo: ROTULO_POR_SLUG.get(ramoSlug) ?? ramoSlug,
          dataEncerramentoProposta: c.dataEncerramentoProposta,
        };
      })
      .filter((a): a is OportunidadeAberta => a !== null);

    const resumo = comporResumo(
      { regiaoLabel: regiaoLabel(p), contratacoesLidas: lidas, alertasNaSemana: alertasSemana, aberturas },
      hoje,
    );

    try {
      const r = await enviarEmailBruto(
        email,
        resumo.assunto,
        renderResumoHtml(resumo),
        renderResumoTexto(resumo),
      );
      if (r.simulado) total.simulados++;
      else if (r.enviado) total.enviados++;
    } catch {
      total.falhas++;
    }
  }

  return total;
}
