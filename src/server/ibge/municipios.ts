/**
 * Base de municípios do IBGE, embarcada (sem chamada externa em runtime).
 * Fonte: servicodados.ibge.gov.br/api/v1/localidades/municipios.
 * Busca pura e testável. Ver cadastro-do-assinante.md.
 */
import municipiosRaw from "@/content/ibge/municipios.json";
import { normalizar } from "@/src/server/casamento/normalizar";

export type Municipio = { codigoIbge: string; nome: string; uf: string };

type LinhaBruta = [number, string, string];

const MUNICIPIOS: Municipio[] = (municipiosRaw as LinhaBruta[]).map(([id, nome, uf]) => ({
  codigoIbge: String(id),
  nome,
  uf,
}));

/** Índice normalizado para busca rápida (nome sem acento/caixa). */
const INDICE = MUNICIPIOS.map((m) => ({ m, chave: normalizar(m.nome) }));

/**
 * Busca municípios por nome dentro de uma UF. Prioriza quem COMEÇA com o termo,
 * depois quem contém. Determinística. Retorna no máximo `limite`.
 */
export function buscarMunicipios(uf: string, termo: string, limite = 8): Municipio[] {
  const alvo = normalizar(termo);
  const ufNorm = uf.toUpperCase();
  if (alvo.length < 2) return [];

  const comeca: Municipio[] = [];
  const contem: Municipio[] = [];
  for (const { m, chave } of INDICE) {
    if (m.uf !== ufNorm) continue;
    if (chave.startsWith(alvo)) comeca.push(m);
    else if (chave.includes(alvo)) contem.push(m);
    if (comeca.length >= limite) break;
  }

  return [...comeca, ...contem].slice(0, limite);
}

/** Busca um município pelo código IBGE. */
export function municipioPorCodigo(codigoIbge: string): Municipio | undefined {
  return MUNICIPIOS.find((m) => m.codigoIbge === codigoIbge);
}

export function totalMunicipios(): number {
  return MUNICIPIOS.length;
}

/** Texto da região a partir do perfil: cidade única, várias cidades ou UF inteira. */
export function regiaoLabel(municipiosIbge: string[] | null | undefined, uf: string | null): string {
  const n = municipiosIbge?.length ?? 0;
  if (n === 1) return municipioPorCodigo(municipiosIbge![0]!)?.nome ?? "sua região";
  if (n > 1) return "suas cidades";
  return uf ? `todo o estado de ${uf}` : "sua região";
}
