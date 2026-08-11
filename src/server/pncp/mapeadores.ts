/**
 * Resposta do PNCP → modelo interno. Puro.
 * Converte valores para centavos (bigint) e datas locais para instantes com timezone.
 * Ver docs/base-de-conhecimentos/regras-sistemicas-ia.md (invariantes "Dado").
 */
import type { ContratacaoPncp, ItemPncp } from "./schemas";
import { ehExclusivoMeEpp } from "./schemas";

/** Offset de America/Sao_Paulo. O Brasil não tem horário de verão desde 2019. */
const OFFSET_SAO_PAULO = "-03:00";

/** reais (float) → centavos (bigint), sem erro de ponto flutuante. */
export function reaisParaCentavos(valor: number | null | undefined): bigint | null {
  if (valor == null) return null;
  return BigInt(Math.round(valor * 100));
}

/**
 * Data local do PNCP (sem offset, ex.: "2026-08-13T23:59:00") → Date em America/Sao_Paulo.
 * Nunca tratar como UTC. Ver fluxos-criticos.md (P1 — prazo errado).
 */
export function dataLocalPncpParaDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const comOffset = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}${OFFSET_SAO_PAULO}`;
  const d = new Date(comOffset);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type ContratacaoInterna = {
  numeroControlePncp: string;
  cnpjOrgao: string;
  orgaoRazaoSocial: string;
  ano: number;
  sequencial: number;
  objetoCompra: string;
  informacaoComplementar: string | null;
  valorTotalEstimadoCentavos: bigint | null;
  uf: string;
  codigoIbge: string;
  municipioNome: string;
  unidadeNome: string | null;
  modalidadeId: number;
  situacaoCompraId: number;
  dataPublicacaoPncp: Date | null;
  dataAberturaProposta: Date | null;
  dataEncerramentoProposta: Date | null;
  linkSistemaOrigem: string | null;
  bruto: unknown;
};

export function mapearContratacao(c: ContratacaoPncp): ContratacaoInterna {
  const link =
    c.linkSistemaOrigem && c.linkSistemaOrigem.toUpperCase() !== "SEM PUBLICAÇÃO"
      ? c.linkSistemaOrigem
      : null;

  return {
    numeroControlePncp: c.numeroControlePNCP,
    cnpjOrgao: c.orgaoEntidade.cnpj,
    orgaoRazaoSocial: c.orgaoEntidade.razaoSocial,
    ano: c.anoCompra,
    sequencial: c.sequencialCompra,
    objetoCompra: c.objetoCompra,
    informacaoComplementar: c.informacaoComplementar ?? null,
    valorTotalEstimadoCentavos: reaisParaCentavos(c.valorTotalEstimado),
    uf: c.unidadeOrgao.ufSigla,
    codigoIbge: c.unidadeOrgao.codigoIbge,
    municipioNome: c.unidadeOrgao.municipioNome,
    unidadeNome: c.unidadeOrgao.nomeUnidade ?? null,
    modalidadeId: c.modalidadeId,
    situacaoCompraId: c.situacaoCompraId,
    dataPublicacaoPncp: dataLocalPncpParaDate(c.dataPublicacaoPncp),
    dataAberturaProposta: dataLocalPncpParaDate(c.dataAberturaProposta),
    dataEncerramentoProposta: dataLocalPncpParaDate(c.dataEncerramentoProposta),
    linkSistemaOrigem: link,
    bruto: c,
  };
}

export type ItemInterno = {
  numeroItem: number;
  descricao: string;
  materialOuServico: string | null;
  quantidade: number | null;
  unidadeMedida: string | null;
  valorUnitarioEstimadoCentavos: bigint | null;
  valorTotalCentavos: bigint | null;
  tipoBeneficioId: number | null;
  tipoBeneficioNome: string | null;
  exclusivoMeEpp: boolean;
  bruto: unknown;
};

export function mapearItem(i: ItemPncp): ItemInterno {
  return {
    numeroItem: i.numeroItem,
    descricao: i.descricao,
    materialOuServico: i.materialOuServico ?? null,
    quantidade: i.quantidade ?? null,
    unidadeMedida: i.unidadeMedida ?? null,
    valorUnitarioEstimadoCentavos: reaisParaCentavos(i.valorUnitarioEstimado),
    valorTotalCentavos: reaisParaCentavos(i.valorTotal),
    tipoBeneficioId: i.tipoBeneficio ?? null,
    tipoBeneficioNome: i.tipoBeneficioNome ?? null,
    exclusivoMeEpp: ehExclusivoMeEpp(i),
    bruto: i,
  };
}
