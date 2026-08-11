/**
 * Carrega o conjunto rotulado de fixtures/rotulados/*.json.
 * Estes arquivos são GERADOS por `pnpm rotulos:sync` a partir do backoffice.
 * O teste lê o arquivo, nunca o banco. Ver ADR-007.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export type ItemRotulado = {
  descricaoItem: string;
  objetoCompra: string;
  informacaoComplementar?: string;
  unidadeMedida?: string;
  /** slug do ramo correto, ou null quando não é de nenhum ramo */
  ramoEsperado: string | null;
  origem: string;
  origemAmostra: "dirigida" | "aleatoria" | "feedback" | "duvida";
  nota?: string;
};

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIR_ROTULADOS = join(AQUI, "../../../fixtures/rotulados");

export function carregarRotulados(): ItemRotulado[] {
  const arquivos = readdirSync(DIR_ROTULADOS).filter((f) => f.endsWith(".json"));
  const itens: ItemRotulado[] = [];
  for (const arquivo of arquivos) {
    const conteudo = readFileSync(join(DIR_ROTULADOS, arquivo), "utf-8");
    itens.push(...(JSON.parse(conteudo) as ItemRotulado[]));
  }
  return itens;
}
