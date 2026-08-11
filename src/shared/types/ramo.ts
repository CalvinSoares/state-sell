/**
 * O catálogo é o produto. Este tipo é o contrato de um ramo.
 * Ver docs/base-de-conhecimentos/regras-de-negocio/catalogo-de-ramos.md
 */

export type Ramo = {
  /** identificador estável — NUNCA renomear depois de publicado */
  slug: string;

  /** como a pessoa vê no cadastro e no e-mail. Português de gente, sem jargão. */
  rotulo: string;

  /** frase curta que aparece no cadastro para desambiguar */
  ajuda: string;

  /**
   * Termos que, sozinhos, já bastam para classificar (peso alto).
   * Escritos JÁ NORMALIZADOS (minúsculo, sem acento, sem pontuação).
   */
  termosFortes: string[];

  /** Termos que contam a favor, mas não decidem sozinhos. Já normalizados. */
  termos: string[];

  /**
   * Se qualquer um aparecer, o item NÃO é deste ramo — veto absoluto,
   * não é ponderado. Já normalizados.
   */
  excluir: string[];

  /** Casa, mas exige estrutura acima de um negócio de uma pessoa. Já normalizados. */
  alertaDeEscala?: string[];

  /** Unidades de medida típicas — sinal fraco de confirmação. Já normalizadas. */
  unidadesEsperadas?: string[];
};

/** Versão do catálogo. Incrementar a cada mudança em content/ramos/*. */
export const VERSAO_CATALOGO = 1;
