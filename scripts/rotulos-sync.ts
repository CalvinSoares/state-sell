/**
 * Banco (rotulo_manual) → fixtures/rotulados/*.json.
 * O CI lê o arquivo, nunca o banco (ADR-007). Rode local e commite o diff
 * junto com a mudança de catálogo.
 *
 *   pnpm rotulos:sync
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { listarRotulos } from "@/src/server/db/repositorios/rotulo.repo";

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIR = join(AQUI, "../fixtures/rotulados");

type Linha = {
  descricaoItem: string;
  objetoCompra: string;
  ramoEsperado: string | null;
  origemAmostra: string;
  nota: string | null;
};

async function main() {
  const rotulos = await listarRotulos();

  // Agrupa por ramo. Itens sem ramo vão para negativos.json.
  const porArquivo = new Map<string, Linha[]>();
  for (const r of rotulos) {
    const arquivo = r.ramoEsperado ?? "negativos";
    const lista = porArquivo.get(arquivo) ?? [];
    lista.push({
      descricaoItem: r.descricaoItem,
      objetoCompra: r.objetoCompra,
      ramoEsperado: r.ramoEsperado,
      origemAmostra: r.origemAmostra,
      nota: r.nota,
    });
    porArquivo.set(arquivo, lista);
  }

  mkdirSync(DIR, { recursive: true });
  for (const [arquivo, linhas] of porArquivo) {
    // ordena de forma estável para o diff ser legível
    linhas.sort((a, b) => a.descricaoItem.localeCompare(b.descricaoItem, "pt-BR"));
    const caminho = join(DIR, `${arquivo}.json`);
    writeFileSync(caminho, JSON.stringify(linhas, null, 2) + "\n", "utf-8");
    process.stdout.write(`${arquivo}.json: ${linhas.length} rótulos\n`);
  }

  process.stdout.write(`\nTotal: ${rotulos.length} rótulos em ${porArquivo.size} arquivos.\n`);
  process.exit(0);
}

main().catch((e) => {
  process.stderr.write(`Falha no sync: ${e}\n`);
  process.exit(1);
});
