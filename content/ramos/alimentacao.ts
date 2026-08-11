import type { Ramo } from "@/src/shared/types/ramo";

/**
 * Alimentação preparada / marmitaria. É o serviço de COMIDA PRONTA.
 * NÃO é hortifruti cru da agricultura familiar (isso é outro ramo, outro cliente),
 * NÃO é equipamento de cozinha.
 * Termos e vetos colhidos de descrições reais do PNCP (verificacao-de-viabilidade.md).
 */
export const alimentacao: Ramo = {
  slug: "alimentacao",
  rotulo: "Alimentação / marmitaria",
  ajuda: "Você prepara e entrega comida: marmita, coffee break, merenda, lanche.",

  termosFortes: [
    "refeicao transportada",
    "refeicoes transportadas",
    "quentinha",
    "marmita",
    "coffee break",
    "kit lanche",
    "generos alimenticios preparados",
    "refeicoes prontas",
    "preparo de refeicoes",
  ],

  termos: [
    "refeicao",
    "refeicoes",
    "merenda",
    "nutricao escolar",
    "fornecimento de alimentacao",
    "cardapio",
    "lanche",
    "salgados",
    "coffee",
  ],

  // Veto: equipamento e insumo cru não são serviço de comida pronta.
  excluir: [
    "equipamento de cozinha",
    "utensilio",
    "freezer",
    "fogao industrial",
    "camara fria",
    "coifa",
    "balcao termico",
    "louca",
    "talher",
    "in natura",
    "hortifruti",
    "agricultura familiar",
  ],

  alertaDeEscala: ["unidades hospitalares", "presidio", "sistema prisional", "hospital regional"],

  unidadesEsperadas: ["unidade", "refeicao", "kit", "porcao"],
};
