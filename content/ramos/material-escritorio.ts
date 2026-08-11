import type { Ramo } from "@/src/shared/types/ramo";

/**
 * Material de escritório e expediente: papel, caneta, grampeador, pastas.
 * NÃO é informática (computador/impressora) nem móveis.
 */
export const materialEscritorio: Ramo = {
  slug: "material-escritorio",
  rotulo: "Material de escritório e expediente",
  ajuda: "Você vende material de escritório: papel, caneta, grampeador, pastas, expediente.",

  termosFortes: [
    "material de expediente",
    "material de escritorio",
    "papel a4",
    "caneta esferografica",
    "grampeador",
  ],

  // Termos específicos: genéricos como "papel"/"caneta" batem em papel higiênico
  // ou caneta odontológica — mantidos só os que não confundem.
  termos: ["esferografica", "lapis", "clips", "grampo trilho", "perfurador", "corretivo"],

  // Veto: equipamento (informática) e mobiliário não são material de consumo.
  excluir: [
    "computador",
    "impressora",
    "mobiliario",
    "cadeira",
    "mesa de escritorio",
    "material grafico",
  ],

  unidadesEsperadas: ["unidade", "caixa", "resma", "pacote"],
};
