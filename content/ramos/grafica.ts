import type { Ramo } from "@/src/shared/types/ramo";

/**
 * Gráfica e impressos: banner, folheto, camiseta estampada, adesivo, impressão.
 * NÃO é aquisição de impressora (informática) nem papel para uso interno (escritório).
 */
export const grafica: Ramo = {
  slug: "grafica",
  rotulo: "Gráfica e impressos",
  ajuda: "Você imprime: banner, folheto, camiseta estampada, adesivo, faixa, cartão.",

  termosFortes: [
    "servico de impressao",
    "servicos graficos",
    "material grafico",
    "banner",
    "folder",
    "panfleto",
    "cartilha",
    "adesivo",
    "faixa em lona",
    "estampa",
    "camiseta estampada",
  ],

  termos: [
    "impressao",
    "grafica",
    "folheto",
    "cartaz",
    "lona",
    "plotagem",
    "encadernacao",
    "carimbo",
    "cracha",
    "certificado impresso",
    "camiseta",
    "personalizada",
  ],

  // Veto: comprar a impressora é informática; papel A4 solto é material de escritório.
  excluir: [
    "aquisicao de impressora",
    "impressora multifuncional",
    "toner",
    "cartucho",
    "papel a4",
    "material de informatica",
  ],

  unidadesEsperadas: ["unidade", "milheiro", "metro", "peca"],
};
