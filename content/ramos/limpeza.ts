import type { Ramo } from "@/src/shared/types/ramo";

/**
 * Limpeza e higiene: material de limpeza e higiene, descartáveis.
 * NÃO é contratação de mão de obra terceirizada com dedicação exclusiva
 * (isso exige estrutura muito acima de MEI) nem equipamento de lavanderia.
 */
export const limpeza: Ramo = {
  slug: "limpeza",
  rotulo: "Limpeza e higiene",
  ajuda: "Você fornece material de limpeza e higiene: produtos, descartáveis, EPI de limpeza.",

  termosFortes: [
    "material de limpeza",
    "produtos de limpeza",
    "material de higiene",
    "produtos de higienizacao",
    "saneante",
    "papel higienico",
    "papel toalha",
  ],

  termos: [
    "limpeza",
    "higiene",
    "detergente",
    "agua sanitaria",
    "desinfetante",
    "alcool em gel",
    "sabonete",
    "vassoura",
    "rodo",
    "saco de lixo",
    "luva descartavel",
  ],

  // Veto: mão de obra com dedicação exclusiva é serviço continuado de porte grande.
  excluir: [
    "dedicacao exclusiva",
    "mao de obra",
    "posto de servico",
    "equipamento de lavanderia",
    "lavadora industrial",
  ],

  alertaDeEscala: ["dedicacao exclusiva", "postos de trabalho"],

  unidadesEsperadas: ["unidade", "litro", "caixa", "fardo", "pacote"],
};
