/**
 * Tipos de certidão do cofre v1. Validade NÃO é presumida — a pessoa informa
 * a data que está no documento. Ver cofre-de-certidoes.md.
 */
export const TIPOS_CERTIDAO = [
  {
    tipo: "cnd_federal",
    rotulo: "CND federal (Receita / PGFN)",
    emissor: "Receita Federal",
    ondeTirar: "https://www.gov.br/receitafederal/pt-br/servicos/certidoes",
    ajuda: "Costuma valer por alguns meses. Confira a data impressa no documento.",
  },
  {
    tipo: "fgts",
    rotulo: "CRF / FGTS",
    emissor: "Caixa",
    ondeTirar: "https://consulta-crf.caixa.gov.br/",
    ajuda: "Costuma vencer rápido (por volta de 30 dias). Renove com folga.",
  },
  {
    tipo: "cndt",
    rotulo: "CNDT (trabalhista)",
    emissor: "Justiça do Trabalho",
    ondeTirar: "https://www.tst.jus.br/certidao",
    ajuda: "Negativa de débitos trabalhistas. Veja a validade no próprio PDF.",
  },
  {
    tipo: "estadual",
    rotulo: "Certidão estadual",
    emissor: "Secretaria da Fazenda do seu estado",
    ondeTirar: null,
    ajuda: "Site da Fazenda do estado da sede do seu CNPJ. Validade varia.",
  },
  {
    tipo: "municipal",
    rotulo: "Certidão municipal",
    emissor: "Prefeitura da sede",
    ondeTirar: null,
    ajuda: "Portal da prefeitura onde sua empresa está registrada. Validade varia.",
  },
] as const;

export type TipoCertidao = (typeof TIPOS_CERTIDAO)[number]["tipo"];

export const TIPOS_CERTIDAO_SLUGS = TIPOS_CERTIDAO.map((t) => t.tipo) as [
  TipoCertidao,
  ...TipoCertidao[],
];

export const TIPO_POR_SLUG = new Map(TIPOS_CERTIDAO.map((t) => [t.tipo, t]));
