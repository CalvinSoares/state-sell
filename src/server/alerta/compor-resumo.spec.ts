import { describe, expect, it } from "vitest";
import { comporResumo, type DadosResumo } from "./compor-resumo";

const AGORA = new Date("2026-08-15T12:00:00-03:00"); // sábado

function dados(over: Partial<DadosResumo>): DadosResumo {
  return {
    regiaoLabel: "Sorocaba",
    contratacoesLidas: 312,
    abertasNaRegiao: 0,
    alertasNaSemana: 0,
    aberturas: [],
    ...over,
  };
}

describe("comporResumo", () => {
  it("prova trabalho: diz quantas compras leu na região", () => {
    const e = comporResumo(dados({}), AGORA);
    expect(e.linhas[0]).toContain("312");
    expect(e.linhas[0]).toContain("Sorocaba");
  });

  it("semana vazia com abertas na região (nenhuma do ramo) é honesta", () => {
    const e = comporResumo(dados({ alertasNaSemana: 0, abertasNaRegiao: 3 }), AGORA);
    const texto = e.linhas.join(" ");
    expect(texto).toContain("3 compras ainda abertas");
    expect(texto).toContain("nenhuma do seu ramo");
  });

  it("semana sem nada aberto na região explica o silêncio", () => {
    const e = comporResumo(dados({ alertasNaSemana: 0, abertasNaRegiao: 0 }), AGORA);
    expect(e.linhas.join(" ")).toContain("não ficou nenhuma compra aberta");
  });

  it("semana com avisos usa plural/singular corretos", () => {
    expect(comporResumo(dados({ alertasNaSemana: 1, abertasNaRegiao: 1 }), AGORA).linhas.join(" ")).toContain(
      "1 aviso ",
    );
    expect(comporResumo(dados({ alertasNaSemana: 3, abertasNaRegiao: 3 }), AGORA).linhas.join(" ")).toContain(
      "3 avisos",
    );
  });

  it("lista oportunidades ainda abertas com dia da semana", () => {
    const e = comporResumo(
      dados({
        abertasNaRegiao: 1,
        aberturas: [
          {
            orgaoRazaoSocial: "MUNICIPIO DE VOTORANTIM",
            municipioNome: "Votorantim",
            ramoRotulo: "Alimentação / marmitaria",
            dataEncerramentoProposta: new Date("2026-08-18T09:00:00-03:00"), // terça
          },
        ],
      }),
      AGORA,
    );
    expect(e.temAberturas).toBe(true);
    expect(e.aberturas[0]).toContain("A Prefeitura de Votorantim");
    expect(e.aberturas[0]).toContain("alimentação");
    expect(e.aberturas[0]).toContain("terça");
  });

  it("sem aberturas, temAberturas é falso", () => {
    expect(comporResumo(dados({}), AGORA).temAberturas).toBe(false);
  });
});
