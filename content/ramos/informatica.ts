import type { Ramo } from "@/src/shared/types/ramo";

/**
 * Informática: equipamentos, periféricos e material de rede.
 * Descrições costumam vir no padrão CATMAT (nome + atributos). NÃO é serviço
 * de impressão (isso é gráfica) nem manutenção predial.
 */
export const informatica: Ramo = {
  slug: "informatica",
  rotulo: "Informática e equipamentos",
  ajuda: "Você vende ou instala computador, rede, periférico, material de informática.",

  termosFortes: [
    "material de informatica",
    "equipamento de informatica",
    "material de rede",
    "computador",
    "microcomputador",
    "notebook",
    "servidor",
    "switch",
    "roteador",
    "nobreak",
    "estabilizador",
  ],

  termos: [
    "informatica",
    "teclado",
    "mouse",
    "monitor",
    "impressora",
    "cabo de rede",
    "conector rj45",
    "disco rigido",
    "memoria ram",
    "fonte de alimentacao",
    "perifericos",
  ],

  // Veto: serviço de impressão é gráfica; suprimento de tinta/toner é consumível.
  excluir: [
    "servico de impressao",
    "outsourcing de impressao",
    "material de construcao",
    "generos alimenticios",
    "refeicao",
  ],

  alertaDeEscala: ["datacenter", "data center"],

  unidadesEsperadas: ["unidade", "peca"],
};
