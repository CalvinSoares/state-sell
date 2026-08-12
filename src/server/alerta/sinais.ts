/**
 * Sinais de decisão do e-mail ("vale a pena olhar?") e aviso de certidão
 * amarrado ao alerta. PURO. Só afirma o que o dado sustenta — zero jargão.
 */
import { diasAteVencimento, situacaoCertidao } from "@/src/server/certidoes/status";
import { TIPO_POR_SLUG } from "@/src/shared/config/certidoes";
import { diasCalendario } from "@/src/shared/utils/data";
import { valorAproximado } from "@/src/shared/utils/formatador";

/** true = bom sinal · false = atenção · null = neutro / não sabemos */
export type Sinal = {
  ok: boolean | null;
  texto: string;
};

export type DadosSinais = {
  exclusivoMeEpp: boolean;
  dataEncerramentoProposta: Date;
  valorTotalEstimadoCentavos: bigint | null;
  /** null = pessoa disse "acima disso" (sem teto) */
  tetoValorCentavos: bigint | null;
  agora: Date;
};

/**
 * Três sinais para decisão em ~10s: exclusivo ME/EPP?, prazo, valor na faixa.
 * Nunca inventa exclusividade nem "está dentro" sem número.
 */
export function sinaisValeOlhar(d: DadosSinais): Sinal[] {
  const exclusivo: Sinal = d.exclusivoMeEpp
    ? { ok: true, texto: "Reservado para micro e pequena empresa" }
    : { ok: null, texto: "Não diz se é só para empresa pequena" };

  const dias = diasCalendario(d.dataEncerramentoProposta, d.agora);
  let prazoTextoCurto: string;
  if (dias === 0) prazoTextoCurto = "Prazo: faltam poucas horas";
  else if (dias === 1) prazoTextoCurto = "Prazo: falta 1 dia";
  else prazoTextoCurto = `Prazo: faltam ${dias} dias`;
  const prazo: Sinal = {
    ok: dias >= 2 ? true : dias >= 1 ? null : false,
    texto: prazoTextoCurto,
  };

  const valor = valorAproximado(d.valorTotalEstimadoCentavos);
  let faixa: Sinal;
  if (!valor || d.valorTotalEstimadoCentavos == null) {
    faixa = { ok: null, texto: "Valor não veio no anúncio" };
  } else if (d.tetoValorCentavos == null) {
    faixa = { ok: true, texto: `${valor} — dentro do que você aguenta` };
  } else if (d.valorTotalEstimadoCentavos <= d.tetoValorCentavos) {
    faixa = { ok: true, texto: `Cabe na sua faixa (${valor})` };
  } else {
    faixa = { ok: false, texto: `Acima do que você disse que dá conta (${valor})` };
  }

  return [exclusivo, prazo, faixa];
}

export type CertidaoParaAviso = {
  tipo: string;
  vencimentoEm: string;
};

/**
 * Se há certidão vencendo em ≤15 dias (ou já vencida), avisa no e-mail do
 * alerta — o cofre deixa de ser gaveta. Null se não há o que lembrar.
 */
export function avisoCertidaoNoAlerta(
  certidoes: CertidaoParaAviso[],
  agora: Date,
): string | null {
  const urgentes = certidoes
    .map((c) => ({
      tipo: c.tipo,
      dias: diasAteVencimento(c.vencimentoEm, agora),
      situacao: situacaoCertidao(c.vencimentoEm, agora),
    }))
    .filter((c) => c.situacao === "atencao" || c.situacao === "vencida")
    .sort((a, b) => a.dias - b.dias);

  const pior = urgentes[0];
  if (!pior || Number.isNaN(pior.dias)) return null;

  const rotulo = TIPO_POR_SLUG.get(pior.tipo as never)?.rotulo ?? "Uma certidão sua";
  if (pior.situacao === "vencida") {
    return `${rotulo} está vencida (pela data que você informou). Renove antes de disputar.`;
  }
  if (pior.dias === 0) {
    return `${rotulo} vence hoje (pela data que você informou). Renove antes de disputar.`;
  }
  if (pior.dias === 1) {
    return `${rotulo} vence amanhã. Renove antes de disputar.`;
  }
  return `${rotulo} vence em ${pior.dias} dias. Renove antes de disputar.`;
}
