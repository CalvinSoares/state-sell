import type { Ramo } from "@/src/shared/types/ramo";

/**
 * Jardinagem e paisagismo: corte de grama, poda, capina, paisagismo, área verde.
 * NÃO é compra de equipamento (roçadeira, cortador) nem limpeza predial.
 */
export const jardinagem: Ramo = {
  slug: "jardinagem",
  rotulo: "Jardinagem e paisagismo",
  ajuda: "Você cuida de área verde: poda, corte de grama, capina, paisagismo, jardim.",

  termosFortes: [
    "corte de grama",
    "rocagem",
    "poda de arvores",
    "capina",
    "paisagismo",
    "manutencao de areas verdes",
    "manutencao de jardins",
  ],

  termos: ["jardim", "jardinagem", "grama", "arborizacao", "poda", "roco", "gramado"],

  // Veto: comprar a máquina é aquisição de equipamento, não o serviço.
  excluir: [
    "aquisicao de rocadeira",
    "cortador de grama",
    "motosserra",
    "trator de corte",
    "aparador de grama",
  ],

  unidadesEsperadas: ["m2", "metro", "servico", "hora"],
};
