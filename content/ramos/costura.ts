import type { Ramo } from "@/src/shared/types/ramo";

/**
 * Costura e uniformes: confecção de uniformes, fardamento, jaleco, avental,
 * roupa profissional, bandeira, enxoval. NÃO é estampa/impressão (gráfica).
 */
export const costura: Ramo = {
  slug: "costura",
  rotulo: "Costura e uniformes",
  ajuda: "Você costura: uniformes, fardamento, jaleco, avental, roupa, bandeira.",

  termosFortes: [
    "confeccao de uniformes",
    "fardamento",
    "uniforme escolar",
    "jaleco",
    "avental",
    "roupa profissional",
    "costura",
  ],

  termos: ["uniforme", "tecido", "bordado", "bandeira", "toalha", "roupa de cama", "enxoval", "cortina"],

  // Veto: estampar/imprimir em camiseta é gráfica.
  excluir: ["camiseta estampada", "estampa", "serigrafia", "impressao"],

  unidadesEsperadas: ["unidade", "peca", "conjunto", "metro"],
};
