/**
 * Cliente HTTP do PNCP: retry com backoff+jitter, timeout, validação Zod.
 * Duas bases distintas (fonte-pncp.md): /api/consulta e /api/pncp.
 */
import {
  EnvelopeConsulta,
  ListaItensPncp,
  type EnvelopeConsulta as TEnvelope,
  type ListaItensPncp as TItens,
} from "./schemas";

const BASE_CONSULTA = "https://pncp.gov.br/api/consulta";
const BASE_PNCP = "https://pncp.gov.br/api/pncp";

const TIMEOUT_MS = 20_000;
const MAX_TENTATIVAS = 3;
/** Neste endpoint o teto real é 50 (não 500). Ver fonte-pncp.md. */
export const TAMANHO_PAGINA = 50;

const USER_AGENT =
  "prefeitura-quer/0.1 (+consumidor educado da API publica do PNCP; avisos@prefeituraquer.com.br)";

export class PncpError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly corpo?: string,
  ) {
    super(message);
    this.name = "PncpError";
  }
}

/** Erro de validação de contrato — deve falhar alto, com o payload preservado. */
export class PncpContratoError extends Error {
  constructor(
    message: string,
    readonly payloadBruto: unknown,
  ) {
    super(message);
    this.name = "PncpContratoError";
  }
}

function esperar(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** backoff exponencial com jitter. `tentativa` começa em 1. */
function atrasoBackoff(tentativa: number): number {
  const base = 500 * 2 ** (tentativa - 1);
  const jitter = base * 0.25 * ((tentativa * 2654435761) % 100) / 100; // determinístico o bastante
  return base + jitter;
}

async function buscarJson(url: string): Promise<unknown> {
  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const resp = await fetch(url, {
        headers: { accept: "application/json", "user-agent": USER_AGENT },
        signal: controller.signal,
      });

      if (resp.status === 429 || resp.status >= 500) {
        // vale a pena repetir
        ultimoErro = new PncpError(`HTTP ${resp.status}`, resp.status);
        await esperar(atrasoBackoff(tentativa));
        continue;
      }
      if (!resp.ok) {
        const corpo = await resp.text().catch(() => "");
        throw new PncpError(`HTTP ${resp.status}`, resp.status, corpo.slice(0, 500));
      }
      return await resp.json();
    } catch (erro) {
      ultimoErro = erro;
      if (erro instanceof PncpError && erro.status && erro.status < 500 && erro.status !== 429) {
        throw erro; // 4xx não-429 não se repete
      }
      if (tentativa < MAX_TENTATIVAS) await esperar(atrasoBackoff(tentativa));
    } finally {
      clearTimeout(timer);
    }
  }

  throw ultimoErro instanceof Error
    ? ultimoErro
    : new PncpError("Falha após todas as tentativas");
}

export type ParamsContratacoesAbertas = {
  /** AAAAMMDD */
  dataFinal: string;
  codigoModalidadeContratacao: number;
  pagina: number;
  uf?: string;
  codigoMunicipioIbge?: string;
};

/** Consulta contratações com período de proposta em aberto. */
export async function consultarContratacoesAbertas(
  params: ParamsContratacoesAbertas,
): Promise<TEnvelope> {
  const q = new URLSearchParams({
    dataFinal: params.dataFinal,
    codigoModalidadeContratacao: String(params.codigoModalidadeContratacao),
    pagina: String(params.pagina),
    tamanhoPagina: String(TAMANHO_PAGINA),
  });
  if (params.uf) q.set("uf", params.uf);
  if (params.codigoMunicipioIbge) q.set("codigoMunicipioIbge", params.codigoMunicipioIbge);

  const bruto = await buscarJson(`${BASE_CONSULTA}/v1/contratacoes/proposta?${q}`);
  const parsed = EnvelopeConsulta.safeParse(bruto);
  if (!parsed.success) {
    throw new PncpContratoError(
      `Envelope de contratações não bate com o schema: ${parsed.error.message}`,
      bruto,
    );
  }
  return parsed.data;
}

/** Itens de uma contratação (base /api/pncp). */
export async function consultarItens(
  cnpj: string,
  ano: number,
  sequencial: number,
): Promise<TItens> {
  const bruto = await buscarJson(
    `${BASE_PNCP}/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/itens`,
  );
  const parsed = ListaItensPncp.safeParse(bruto);
  if (!parsed.success) {
    throw new PncpContratoError(
      `Lista de itens não bate com o schema: ${parsed.error.message}`,
      bruto,
    );
  }
  return parsed.data;
}
