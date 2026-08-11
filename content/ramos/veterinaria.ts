import type { Ramo } from "@/src/shared/types/ramo";

/**
 * Veterinária e agropecuária: medicamento veterinário, ração, vacina animal,
 * serviços veterinários. NÃO é gênero alimentício humano (alimentação).
 */
export const veterinaria: Ramo = {
  slug: "veterinaria",
  rotulo: "Veterinária e agropecuária",
  ajuda: "Você é da área animal: medicamento veterinário, ração, vacina, serviços veterinários.",

  termosFortes: [
    "medicamento veterinario",
    "racao animal",
    "vacina animal",
    "servicos veterinarios",
    "castracao de animais",
    "insumos agropecuarios",
  ],

  termos: ["veterinario", "semovente", "racao", "vermifugo", "zoonose", "animal"],

  // Veto: comida de gente é alimentação, não agropecuária.
  excluir: ["genero alimenticio", "alimentacao escolar", "refeicao"],

  unidadesEsperadas: ["kg", "unidade", "dose", "servico"],
};
