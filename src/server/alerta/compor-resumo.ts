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
  /** Ainda abertas na região (qualquer ramo) — prova que o serviço olhou. */
  abertasNaRegiao: number;
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

function plural(n: number, um: string, muitos: string): string {
  return n === 1 ? um : muitos;
}

export function comporResumo(d: DadosResumo, agora: Date): EmailResumo {
  const linhas: string[] = [];
  linhas.push(
    `A gente leu ${d.contratacoesLidas.toLocaleString("pt-BR")} compras publicadas em ${d.regiaoLabel} nesta semana.`,
  );

  const doRamo = d.aberturas.length;

  if (d.alertasNaSemana === 0) {
    if (d.abertasNaRegiao > 0 && doRamo === 0) {
      linhas.push(
        `Tem ${d.abertasNaRegiao} ${plural(d.abertasNaRegiao, "compra ainda aberta", "compras ainda abertas")} na sua região; nenhuma do seu ramo dentro do seu limite. A gente só avisa quando bate — isso é confiança, não silêncio.`,
      );
    } else if (d.abertasNaRegiao === 0) {
      linhas.push(
        "Nesta semana não ficou nenhuma compra aberta na sua região. Por isso não teve e-mail no meio da semana. Isso é comum.",
      );
    } else {
      linhas.push(
        "Nenhuma casou com o que você vende dentro do seu limite — por isso não teve e-mail no meio da semana. Isso é comum.",
      );
    }
  } else if (d.alertasNaSemana === 1) {
    linhas.push("Você recebeu 1 aviso esta semana.");
    if (d.abertasNaRegiao > doRamo) {
      linhas.push(
        `Na região ainda há ${d.abertasNaRegiao} ${plural(d.abertasNaRegiao, "compra aberta", "compras abertas")} — a gente só te manda o que serve pro seu ramo.`,
      );
    }
  } else {
    linhas.push(`Você recebeu ${d.alertasNaSemana} avisos esta semana.`);
    if (d.abertasNaRegiao > doRamo) {
      linhas.push(
        `Na região ainda há ${d.abertasNaRegiao} compras abertas — a gente só te manda o que serve pro seu ramo.`,
      );
    }
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
