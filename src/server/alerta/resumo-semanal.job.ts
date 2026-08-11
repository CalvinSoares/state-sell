import "server-only";
import { regiaoLabel } from "@/src/server/ibge/municipios";
import { contratacoesCandidatas, perfisAtivosComEmail } from "@/src/server/db/repositorios/alerta.repo";
import {
  alertasEnviadosDesdePorAssinante,
  contratacoesColetadasPorRegiao,
  detalhesContratacoes,
} from "@/src/server/db/repositorios/resumo.repo";
import { log } from "@/src/server/log";
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

/** Contratações lidas na região do perfil, a partir dos mapas agregados (sem N+1). */
function lidasNaRegiao(
  p: PerfilAssinante,
  porIbge: Map<string, number>,
  porUf: Map<string, number>,
): number {
  if (p.municipiosIbge.length > 0) {
    return p.municipiosIbge.reduce((s, ibge) => s + (porIbge.get(ibge) ?? 0), 0);
  }
  return p.uf ? (porUf.get(p.uf) ?? 0) : 0;
}

/** Top-N contratações ainda abertas que servem para o assinante (não só as alertadas). */
function aberturasPara(
  candidatas: ContratacaoParaSelecao[],
  p: PerfilAssinante,
  agora: Date,
): { contratacaoId: string; ramoSlug: string }[] {
  return candidatas
    .map((c) => selecionarPara(c, p, agora))
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => a.prioridade - b.prioridade)
    .slice(0, MAX_ABERTURAS)
    .map((s) => ({ contratacaoId: s.contratacaoId, ramoSlug: s.ramoSlug }));
}

/**
 * Resumo de sábado. Vai para TODOS os ativos, inclusive quem não recebeu nada.
 * Consultas agregadas ANTES do laço (sem N+1): perfis+e-mail, coletadas por
 * região, enviados por assinante e detalhes das aberturas — tudo em lote.
 */
export async function resumoSemanalJob(agora: () => number = Date.now): Promise<ResultadoResumo> {
  const hoje = new Date(agora());
  const desde = new Date(agora() - UMA_SEMANA_MS);

  const [perfisComEmail, candidatas, regiao, enviadosPorAssinante] = await Promise.all([
    perfisAtivosComEmail(),
    contratacoesCandidatas(hoje),
    contratacoesColetadasPorRegiao(desde),
    alertasEnviadosDesdePorAssinante(desde),
  ]);

  // Aberturas de todos os assinantes, para buscar os detalhes numa query só.
  const aberturasPorAssinante = perfisComEmail.map(({ perfil }) => aberturasPara(candidatas, perfil, hoje));
  const todosIds = [...new Set(aberturasPorAssinante.flatMap((a) => a.map((x) => x.contratacaoId)))];
  const detalhes = await detalhesContratacoes(todosIds);
  const mapaCandidata = new Map(candidatas.map((c) => [c.contratacaoId, c]));

  const total: ResultadoResumo = { assinantes: 0, enviados: 0, simulados: 0, falhas: 0 };

  for (let i = 0; i < perfisComEmail.length; i++) {
    const { perfil, email } = perfisComEmail[i]!;
    total.assinantes++;

    const aberturas: OportunidadeAberta[] = aberturasPorAssinante[i]!
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
      {
        regiaoLabel: regiaoLabel(perfil.municipiosIbge, perfil.uf),
        contratacoesLidas: lidasNaRegiao(perfil, regiao.porIbge, regiao.porUf),
        alertasNaSemana: enviadosPorAssinante.get(perfil.assinanteId) ?? 0,
        aberturas,
      },
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
    } catch (erro) {
      log.error("resumo.falha_envio", { assinanteId: perfil.assinanteId });
      total.falhas++;
    }
  }

  return total;
}
