import type { Ramo } from "@/src/shared/types/ramo";

/**
 * Transporte e fretamento: transporte escolar, fretamento, van, locação de
 * veículo com motorista. NÃO é compra de veículo, peça, pneu ou combustível.
 */
export const transporte: Ramo = {
  slug: "transporte",
  rotulo: "Transporte e fretamento",
  ajuda: "Você transporta gente: transporte escolar, fretamento, van, locação com motorista.",

  termosFortes: [
    "transporte escolar",
    "fretamento",
    "locacao de veiculo com motorista",
    "transporte de passageiros",
    "transporte de pacientes",
    "servico de transporte",
  ],

  termos: ["van", "onibus", "micro onibus", "translado", "frete", "condutor", "motorista"],

  // Veto: comprar/consertar o veículo não é o serviço de transporte.
  excluir: [
    "aquisicao de veiculo",
    "pneu",
    "peca automotiva",
    "combustivel",
    "manutencao de veiculo",
    "locacao sem motorista",
  ],

  alertaDeEscala: ["frota", "transporte intermunicipal de grande porte"],
  unidadesEsperadas: ["km", "servico", "mes", "diaria"],
};
