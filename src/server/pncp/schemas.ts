/**
 * Contrato do PNCP validado na fronteira. Mudança de schema deve FALHAR ALTO,
 * nunca em silêncio. Campos verificados por chamada real em 10/08/2026.
 * Ver docs/base-de-conhecimentos/backend-contexto/fonte-pncp.md
 */
import { z } from "zod";

const OrgaoEntidade = z.object({
  cnpj: z.string(),
  razaoSocial: z.string(),
  poderId: z.string().nullish(),
  esferaId: z.string().nullish(),
});

const UnidadeOrgao = z.object({
  ufNome: z.string().nullish(),
  ufSigla: z.string(),
  codigoIbge: z.string(),
  municipioNome: z.string(),
  codigoUnidade: z.string().nullish(),
  nomeUnidade: z.string().nullish(),
});

/** Item do envelope de /contratacoes/proposta. Campos extras são ignorados. */
export const ContratacaoPncp = z.object({
  numeroControlePNCP: z.string(),
  orgaoEntidade: OrgaoEntidade,
  unidadeOrgao: UnidadeOrgao,
  anoCompra: z.number().int(),
  sequencialCompra: z.number().int(),
  numeroCompra: z.string().nullish(),
  processo: z.string().nullish(),
  objetoCompra: z.string(),
  informacaoComplementar: z.string().nullish(),
  valorTotalEstimado: z.number().nullish(),
  valorTotalHomologado: z.number().nullish(),
  modalidadeId: z.number().int(),
  modalidadeNome: z.string(),
  situacaoCompraId: z.number().int(),
  situacaoCompraNome: z.string().nullish(),
  // datas locais sem offset — normalizar para America/Sao_Paulo na borda
  dataPublicacaoPncp: z.string(),
  dataAberturaProposta: z.string().nullish(),
  dataEncerramentoProposta: z.string().nullish(),
  linkSistemaOrigem: z.string().nullish(),
  srp: z.boolean().nullish(),
});
export type ContratacaoPncp = z.infer<typeof ContratacaoPncp>;

/** Envelope paginado das consultas. */
export const EnvelopeConsulta = z.object({
  data: z.array(ContratacaoPncp),
  totalRegistros: z.number().int(),
  totalPaginas: z.number().int(),
  numeroPagina: z.number().int(),
  paginasRestantes: z.number().int(),
  empty: z.boolean(),
});
export type EnvelopeConsulta = z.infer<typeof EnvelopeConsulta>;

/** Item de /orgaos/{cnpj}/compras/{ano}/{seq}/itens — array puro, sem envelope. */
export const ItemPncp = z.object({
  numeroItem: z.number().int(),
  descricao: z.string(),
  materialOuServico: z.string().nullish(),
  materialOuServicoNome: z.string().nullish(),
  valorUnitarioEstimado: z.number().nullish(),
  valorTotal: z.number().nullish(),
  quantidade: z.number().nullish(),
  unidadeMedida: z.string().nullish(),
  // o campo mais importante do produto — ver fonte-pncp.md
  tipoBeneficio: z.number().int().nullish(),
  tipoBeneficioNome: z.string().nullish(),
  criterioJulgamentoNome: z.string().nullish(),
  situacaoCompraItemNome: z.string().nullish(),
});
export type ItemPncp = z.infer<typeof ItemPncp>;

export const ListaItensPncp = z.array(ItemPncp);
export type ListaItensPncp = z.infer<typeof ListaItensPncp>;

/** Situação "Divulgada no PNCP" — só isso gera alerta. */
export const SITUACAO_DIVULGADA = 1;

/** Modalidades de interesse (verificacao-de-viabilidade.md). */
export const MODALIDADE = {
  dispensa: 8,
  pregaoEletronico: 6,
} as const;

/** tipoBeneficio que indica exclusividade — string normalizada, ver fonte-pncp.md. */
export function ehExclusivoMeEpp(item: ItemPncp): boolean {
  return (item.tipoBeneficioNome ?? "").toLowerCase().includes("exclusiv");
}
