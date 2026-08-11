/**
 * Dados → conteúdo do e-mail. PURO. Só afirma o que o dado sustenta.
 * Zero jargão. Ver docs/base-de-conhecimentos/regras-de-negocio/alertas-e-envio.md
 */
import { prazoTexto } from "@/src/shared/utils/data";
import { quantidadeTexto, valorAproximado } from "@/src/shared/utils/formatador";

export type DadosContratacao = {
  orgaoRazaoSocial: string;
  municipioNome: string;
  unidadeNome: string | null;
  valorTotalEstimadoCentavos: bigint | null;
  dataEncerramentoProposta: Date;
  linkSistemaOrigem: string | null;
  numeroControlePncp: string;
};

export type DadosItemPrincipal = {
  descricao: string;
  quantidade: number | null;
  unidadeMedida: string | null;
  exclusivoMeEpp: boolean;
  escala: boolean;
};

export type EmailAlerta = {
  assunto: string;
  /** título humano: "A Prefeitura de Sorocaba quer comprar marmita." */
  titulo: string;
  linhas: string[];
  avisoEscala: string | null;
  prazo: string;
  verEditalUrl: string;
  comoParticiparUrl: string;
  /** por que este alerta chegou — rodapé de transparência */
  porque: string;
};

const PREFIXO_MUNICIPAL = /^(MUNICIPIO DE|PREFEITURA MUNICIPAL DE|PREFEITURA DE)\s+/i;

/**
 * Nome humano do órgão, sem CNPJ nem jargão. Só chama de "Prefeitura" quando é
 * de fato municipal — secretaria estadual, universidade e autarquia mantêm o
 * próprio nome (o e-mail mentiria dizendo "A Prefeitura de Universidade...").
 */
function orgaoHumano(orgao: string, municipio: string): string {
  if (PREFIXO_MUNICIPAL.test(orgao)) {
    const cidade = orgao.replace(PREFIXO_MUNICIPAL, "").trim() || municipio;
    return `A Prefeitura de ${tituloCaso(cidade)}`;
  }
  return tituloCaso(orgao);
}

function tituloCaso(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((p) => (p.length <= 2 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

/** Corta a descrição CATMAT no primeiro atributo ("Nome, attr: x") para o e-mail. */
function nomeCurtoDoItem(descricao: string): string {
  const semAtributos = descricao.split(/,|\s\w+:/)[0] ?? descricao;
  return semAtributos.trim().toLowerCase();
}

export function comporEmail(
  c: DadosContratacao,
  item: DadosItemPrincipal,
  ramoRotulo: string,
  termosCasados: string[],
  appUrl: string,
  agora: Date,
): EmailAlerta {
  const prazo = prazoTexto(c.dataEncerramentoProposta, agora);
  const diaSemana = prazo.split(",")[0];
  const linkEdital = c.linkSistemaOrigem ?? `https://pncp.gov.br/app/editais`;

  const linhas: string[] = [];

  const quantidade = quantidadeTexto(item.quantidade, item.unidadeMedida);
  const paraOnde = c.unidadeNome ? `para ${c.unidadeNome}` : `em ${tituloCaso(c.municipioNome)}`;
  if (quantidade) {
    linhas.push(`${quantidade} de ${nomeCurtoDoItem(item.descricao)}, ${paraOnde}.`);
  } else {
    linhas.push(`${capitalizar(nomeCurtoDoItem(item.descricao))}, ${paraOnde}.`);
  }

  const valor = valorAproximado(c.valorTotalEstimadoCentavos);
  if (valor) linhas.push(`Valor estimado: ${valor}.`);

  // Só afirma exclusividade se o DADO diz isso (tipoBeneficio), nunca por valor.
  if (item.exclusivoMeEpp) linhas.push("Exclusivo para micro e pequena empresa.");

  const titulo = `${orgaoHumano(c.orgaoRazaoSocial, c.municipioNome)} quer comprar ${ramoRotuloCurto(ramoRotulo)}.`;

  return {
    assunto: `${orgaoHumano(c.orgaoRazaoSocial, c.municipioNome)} quer comprar ${ramoRotuloCurto(ramoRotulo)} — prazo até ${diaSemana}`,
    titulo,
    linhas,
    avisoEscala: item.escala
      ? "Atenção: esse pedido pede estrutura grande. Confira se você dá conta antes de participar."
      : null,
    prazo: `Prazo para proposta: ${prazo}.`,
    verEditalUrl: linkEdital,
    comoParticiparUrl: `${appUrl}/trilha`,
    porque: `Esse aviso chegou porque você vende ${ramoRotuloCurto(ramoRotulo)}${
      termosCasados.length ? ` (encontramos: ${termosCasados.slice(0, 3).join(", ")})` : ""
    } em ${tituloCaso(c.municipioNome)}.`,
  };
}

function ramoRotuloCurto(rotulo: string): string {
  // "Alimentação / marmitaria" → "alimentação"
  return (rotulo.split("/")[0] ?? rotulo).trim().toLowerCase();
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
