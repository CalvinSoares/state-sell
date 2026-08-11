import type { Ramo } from "@/src/shared/types/ramo";

/**
 * Móveis e mobiliário: cadeira, mesa, armário, estante, longarina, mobiliário
 * escolar. NÃO é material de expediente, nem conserto/reforma de móveis, nem
 * cadeira odontológica/de rodas (equipamento de saúde).
 */
export const mobiliario: Ramo = {
  slug: "mobiliario",
  rotulo: "Móveis e mobiliário",
  ajuda: "Você fornece móveis: cadeira, mesa, armário, estante, longarina.",

  termosFortes: [
    "mobiliario escolar",
    "conjunto de mesa e cadeira",
    "longarina",
    "armario de aco",
    "estante de aco",
  ],

  termos: ["movel", "mobiliario", "cadeira", "mesa", "armario", "estante", "poltrona", "gaveteiro"],

  excluir: [
    "material de expediente",
    "reforma de moveis",
    "conserto de cadeira",
    "cadeira odontologica",
    "cadeira de rodas",
    "estofamento",
  ],

  unidadesEsperadas: ["unidade", "conjunto", "peca"],
};
