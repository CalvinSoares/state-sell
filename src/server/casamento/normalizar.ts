/**
 * Normalização aplicada IGUALMENTE ao texto do PNCP e aos termos do catálogo.
 * Função pura, sem I/O, sem Date, sem random.
 *
 * Ver docs/base-de-conhecimentos/regras-de-negocio/casamento.md
 */

/**
 * minúsculas → remove acento → troca pontuação/barra por espaço → colapsa espaços.
 * "AQUISIÇÃO DE REFEIÇÕES/QUENTINHAS" → "aquisicao de refeicoes quentinhas"
 */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove diacríticos (combining marks)
    .replace(/[^a-z0-9]+/g, " ") // tudo que não é letra/número vira espaço
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Casa um termo (multi-palavra) dentro de um texto por LIMITE DE PALAVRA.
 * Ambos devem chegar já normalizados. "cabo" não casa dentro de "cabotagem".
 */
export function contemTermo(textoNormalizado: string, termoNormalizado: string): boolean {
  if (termoNormalizado === "") return false;
  // \b não funciona bem com sequências multi-palavra + acentos já removidos;
  // usamos fronteiras explícitas de início/fim ou espaço.
  const escapado = termoNormalizado.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const padrao = new RegExp(`(^|\\s)${escapado}(\\s|$)`);
  return padrao.test(textoNormalizado);
}
