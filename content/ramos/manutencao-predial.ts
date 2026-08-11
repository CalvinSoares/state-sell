import type { Ramo } from "@/src/shared/types/ramo";

/**
 * Pequenos reparos e manutenção predial: elétrica, hidráulica, pintura, reparos.
 * Território de autônomo. NÃO é obra nova de grande porte nem projeto de engenharia.
 */
export const manutencaoPredial: Ramo = {
  slug: "manutencao-predial",
  rotulo: "Pequenos reparos e manutenção",
  ajuda: "Você faz reparo: elétrica, hidráulica, pintura, conserto predial, pequenos serviços.",

  termosFortes: [
    "manutencao predial",
    "manutencao preventiva e corretiva",
    "servicos de manutencao",
    "reparos hidraulicos",
    "reparos eletricos",
    "servico de pintura",
    "manutencao eletrica",
    "manutencao hidraulica",
  ],

  termos: [
    "manutencao",
    "reparo",
    "pintura",
    "eletrica",
    "hidraulica",
    "troca de lampadas",
    "conserto",
    "instalacao eletrica",
    "pedreiro",
    "encanador",
    "eletricista",
  ],

  // Veto: obra nova, projeto de engenharia e pavimentação são outra escala/outro ramo.
  // Estofaria/marcenaria compartilham "serviços de manutenção" mas são outro ofício.
  excluir: [
    "construcao de",
    "obra nova",
    "projeto executivo",
    "projeto de engenharia",
    "pavimentacao",
    "recapeamento",
    "reforma completa",
    "ampliacao do predio",
    "tapecaria",
    "estofamento",
    "moveis e utensilios",
  ],

  alertaDeEscala: ["reforma geral", "construcao"],

  unidadesEsperadas: ["servico", "metro", "hora", "unidade"],
};
