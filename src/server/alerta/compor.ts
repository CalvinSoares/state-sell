/**
 * Dados → conteúdo do e-mail. PURO. Só afirma o que o dado sustenta.
 * Zero jargão. Ver docs/base-de-conhecimentos/regras-de-negocio/alertas-e-envio.md
 */
import { prazoTexto } from "@/src/shared/utils/data";
import { quantidadeTexto } from "@/src/shared/utils/formatador";
import {
  avisoCertidaoNoAlerta,
  sinaisValeOlhar,
  type CertidaoParaAviso,
  type Sinal,
} from "./sinais";

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
  /** Três sinais para decisão em ~10s. */
  sinais: Sinal[];
  avisoEscala: string | null;
  /** Certidão do cofre vencendo / vencida — amarrada ao alerta. */
  avisoCertidao: string | null;
  certidoesUrl: string | null;
  prazo: string;
  verEditalUrl: string;
  comoParticiparUrl: string;
  /** link assinado "não era pra mim" (opcional; montado no job com o alertaId) */
  naoEraPraMimUrl?: string;
  /** link assinado de descadastro (opcional; montado no job com o e-mail) */
  descadastrarUrl?: string;
  /** por que este alerta chegou — rodapé de transparência */
  porque: string;
};

const PREFIXO_MUNICIPAL = /^(MUNICIPIO DE|PREFEITURA MUNICIPAL DE|PREFEITURA DE)\s+/i;

/**
 * Nome humano do órgão, sem CNPJ nem jargão. Só chama de "Prefeitura" quando é
 * de fato municipal — secretaria estadual, universidade e autarquia mantêm o
 * próprio nome (o e-mail mentiria dizendo "A Prefeitura de Universidade...").
 */
export function orgaoHumano(orgao: string, municipio: string): string {
  if (PREFIXO_MUNICIPAL.test(orgao)) {
    const cidade = orgao.replace(PREFIXO_MUNICIPAL, "").trim() || municipio;
    return `A Prefeitura de ${tituloCaso(cidade)}`;
  }
  return tituloCaso(orgao);
}

export function tituloCaso(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((p) => (p.length <= 2 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

/**
 * Link do edital. Prefere o link do sistema de origem quando é uma URL de
 * verdade; senão monta o link direto da contratação no PNCP a partir do
 * numeroControlePncp ("CNPJ-1-SEQUENCIAL/ANO"). Puro.
 */
export function linkDoEdital(linkSistemaOrigem: string | null, numeroControlePncp: string): string {
  if (linkSistemaOrigem && /^https?:\/\//i.test(linkSistemaOrigem.trim())) {
    return linkSistemaOrigem.trim();
  }
  const m = numeroControlePncp.match(/^(\d+)-\d+-(\d+)\/(\d+)$/);
  if (m) {
    const [, cnpj, sequencial, ano] = m;
    return `https://pncp.gov.br/app/editais/${cnpj}/${ano}/${Number(sequencial)}`;
  }
  return "https://pncp.gov.br/app/editais";
}

/** Corta a descrição CATMAT no primeiro atributo ("Nome, attr: x") para o e-mail. */
function nomeCurtoDoItem(descricao: string): string {
  const semAtributos = descricao.split(/,|\s\w+:/)[0] ?? descricao;
  return semAtributos.trim().toLowerCase();
}

export type OpcoesComporEmail = {
  naoEraPraMimUrl?: string;
  descadastrarUrl?: string;
  lembrete?: boolean;
  /** Teto do perfil (centavos). null = sem teto / "acima disso". */
  tetoValorCentavos?: bigint | null;
  /** Certidões do cofre — para aviso amarrado ao alerta. */
  certidoes?: CertidaoParaAviso[];
};

export function comporEmail(
  c: DadosContratacao,
  item: DadosItemPrincipal,
  ramoRotulo: string,
  termosCasados: string[],
  appUrl: string,
  agora: Date,
  opcoes: OpcoesComporEmail = {},
): EmailAlerta {
  const {
    naoEraPraMimUrl,
    descadastrarUrl,
    lembrete = false,
    tetoValorCentavos = null,
    certidoes = [],
  } = opcoes;

  const prazo = prazoTexto(c.dataEncerramentoProposta, agora);
  const diaSemana = prazo.split(",")[0];
  const linkEdital = linkDoEdital(c.linkSistemaOrigem, c.numeroControlePncp);

  const linhas: string[] = [];

  const quantidade = quantidadeTexto(item.quantidade, item.unidadeMedida);
  const paraOnde = c.unidadeNome ? `para ${c.unidadeNome}` : `em ${tituloCaso(c.municipioNome)}`;
  if (quantidade) {
    linhas.push(`${quantidade} de ${nomeCurtoDoItem(item.descricao)}, ${paraOnde}.`);
  } else {
    linhas.push(`${capitalizar(nomeCurtoDoItem(item.descricao))}, ${paraOnde}.`);
  }

  // Valor e exclusividade vão no bloco "Vale a pena olhar?" — decisão em 10s.
  const sinais = sinaisValeOlhar({
    exclusivoMeEpp: item.exclusivoMeEpp,
    dataEncerramentoProposta: c.dataEncerramentoProposta,
    valorTotalEstimadoCentavos: c.valorTotalEstimadoCentavos,
    tetoValorCentavos,
    agora,
  });

  const avisoCertidao = avisoCertidaoNoAlerta(certidoes, agora);

  const orgao = orgaoHumano(c.orgaoRazaoSocial, c.municipioNome);
  const ramo = ramoRotuloCurto(ramoRotulo);
  const titulo = lembrete
    ? `Última chamada: ${orgao} quer comprar ${ramo}.`
    : `${orgao} quer comprar ${ramo}.`;

  return {
    assunto: lembrete
      ? `Última chamada: ${orgao} quer comprar ${ramo} — prazo até ${diaSemana}`
      : `${orgao} quer comprar ${ramo} — prazo até ${diaSemana}`,
    titulo,
    linhas,
    sinais,
    avisoEscala: item.escala
      ? "Atenção: esse pedido pede estrutura grande. Confira se você dá conta antes de participar."
      : null,
    avisoCertidao,
    certidoesUrl: avisoCertidao ? `${appUrl}/certidoes` : null,
    prazo: `Prazo para proposta: ${prazo}.`,
    verEditalUrl: linkEdital,
    comoParticiparUrl: `${appUrl}/trilha`,
    naoEraPraMimUrl,
    descadastrarUrl,
    porque: `Esse aviso chegou porque você vende ${ramoRotuloCurto(ramoRotulo)}${
      termosCasados.length ? ` (encontramos: ${termosCasados.slice(0, 3).join(", ")})` : ""
    } em ${tituloCaso(c.municipioNome)}.`,
  };
}

export function ramoRotuloCurto(rotulo: string): string {
  // "Alimentação / marmitaria" → "alimentação"
  return (rotulo.split("/")[0] ?? rotulo).trim().toLowerCase();
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
