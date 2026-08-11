/**
 * Dados → resumo semanal de sábado. PURO. Vai para TODOS os ativos, inclusive
 * quem não recebeu nada — silêncio sem explicação parece defeito.
 * Ver alertas-e-envio.md (Resumo semanal).
 */
import { prazoTexto } from "@/src/shared/utils/data";
import { orgaoHumano, ramoRotuloCurto } from "./compor";

export type OportunidadeAberta = {
  orgaoRazaoSocial: string;
  municipioNome: string;
  ramoRotulo: string;
  dataEncerramentoProposta: Date;
};

export type DadosResumo = {
  /** "Sorocaba" ou "todo o estado de SP" */
  regiaoLabel: string;
  contratacoesLidas: number;
  alertasNaSemana: number;
  aberturas: OportunidadeAberta[];
};

export type EmailResumo = {
  assunto: string;
  titulo: string;
  linhas: string[];
  aberturas: string[];
  temAberturas: boolean;
};

export function comporResumo(d: DadosResumo, agora: Date): EmailResumo {
  const linhas: string[] = [];
  linhas.push(`A gente leu ${d.contratacoesLidas.toLocaleString("pt-BR")} compras publicadas em ${d.regiaoLabel} nesta semana.`);

  if (d.alertasNaSemana === 0) {
    linhas.push(
      "Nenhuma era do que você vende dentro do seu limite — por isso você não recebeu nada. Isso acontece, e quer dizer que o serviço está funcionando.",
    );
  } else if (d.alertasNaSemana === 1) {
    linhas.push("Você recebeu 1 aviso esta semana.");
  } else {
    linhas.push(`Você recebeu ${d.alertasNaSemana} avisos esta semana.`);
  }

  const aberturas = d.aberturas.map((a) => {
    const dia = prazoTexto(a.dataEncerramentoProposta, agora).split(",")[0];
    return `${orgaoHumano(a.orgaoRazaoSocial, a.municipioNome)} — ${ramoRotuloCurto(a.ramoRotulo)} — prazo até ${dia}`;
  });

  return {
    assunto: `Essa semana em ${d.regiaoLabel}`,
    titulo: `Essa semana em ${d.regiaoLabel}`,
    linhas,
    aberturas,
    temAberturas: aberturas.length > 0,
  };
}
