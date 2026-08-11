import { describe, expect, it } from "vitest";
import { RAMOS } from "@/content/ramos";
import { carregarRotulados } from "./fixtures";
import { avaliarRamo } from "./metricas";

/** Gate: precisão < 0,95 na amostra aleatória trava o CI. */
const GATE_PRECISAO = 0.95;

const rotulados = carregarRotulados();

describe("métricas do casamento", () => {
  it("há conjunto rotulado carregado", () => {
    expect(rotulados.length).toBeGreaterThan(0);
  });

  for (const ramo of RAMOS) {
    it(`${ramo.slug}: precisão ≥ ${GATE_PRECISAO} (amostra aleatória)`, () => {
      const m = avaliarRamo(ramo, [...RAMOS], rotulados, { apenasAmostraAleatoria: true });

      const detalhe = m.exemplosFalsosPositivos
        .map((e) => `  FP: "${e.descricaoItem}" (esperado: ${e.ramoEsperado ?? "nenhum"})`)
        .join("\n");

      expect(
        m.precisao,
        `${ramo.slug}: precisão ${m.precisao.toFixed(3)} (vp=${m.verdadeirosPositivos} fp=${m.falsosPositivos})\n${detalhe}`,
      ).toBeGreaterThanOrEqual(GATE_PRECISAO);
    });
  }

  // Relatório por origem — não trava. Mostra precisão geral e a da amostra
  // aleatória (a que vale como gate) lado a lado, mais o recall.
  it("relatório por origem (não trava o CI)", () => {
    const linhas = RAMOS.map((ramo) => {
      const geral = avaliarRamo(ramo, [...RAMOS], rotulados);
      const aleat = avaliarRamo(ramo, [...RAMOS], rotulados, { apenasAmostraAleatoria: true });
      return (
        `${ramo.slug.padEnd(20)} ` +
        `precisão(geral)=${geral.precisao.toFixed(2)} ` +
        `precisão(aleatória)=${aleat.precisao.toFixed(2)} ` +
        `recall=${geral.recall.toFixed(2)} ` +
        `(fp=${geral.falsosPositivos} fn=${geral.falsosNegativos})`
      );
    });
    process.stdout.write("\n" + linhas.join("\n") + "\n");
    expect(true).toBe(true);
  });
});
