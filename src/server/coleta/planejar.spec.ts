import { describe, expect, it } from "vitest";
import {
  chaveCursor,
  combinacoesPadrao,
  fezOrcamento,
  formatarDataFinal,
  ordenarPorMaisAntigo,
  parseChaveCursor,
  proximoCursor,
} from "./planejar";

describe("cursor", () => {
  it("chave e parse são inversos", () => {
    const c = { uf: "SP", modalidadeId: 8 };
    expect(chaveCursor(c)).toBe("SP:8");
    expect(parseChaveCursor("SP:8")).toEqual(c);
  });

  it("próximo cursor avança quando há páginas restantes", () => {
    expect(proximoCursor(3, 5)).toEqual({ ultimaPagina: 4 });
  });

  it("próximo cursor volta para 1 quando o ciclo termina", () => {
    expect(proximoCursor(13, 0)).toEqual({ ultimaPagina: 1 });
  });
});

describe("ordenação por mais antigo", () => {
  it("combinação nunca coletada vem primeiro", () => {
    const combos = [
      { uf: "SP", modalidadeId: 8 },
      { uf: "MG", modalidadeId: 8 },
    ];
    const atualizado = new Map([["SP:8", 1000]]); // MG nunca coletado
    const ordenado = ordenarPorMaisAntigo(combos, atualizado);
    expect(ordenado[0]).toEqual({ uf: "MG", modalidadeId: 8 });
  });

  it("entre coletadas, a mais antiga vem primeiro", () => {
    const combos = [
      { uf: "SP", modalidadeId: 8 },
      { uf: "MG", modalidadeId: 8 },
    ];
    const atualizado = new Map([
      ["SP:8", 5000],
      ["MG:8", 2000],
    ]);
    expect(ordenarPorMaisAntigo(combos, atualizado)[0]).toEqual({ uf: "MG", modalidadeId: 8 });
  });
});

describe("orçamento de tempo", () => {
  it("não estourou dentro do limite", () => {
    expect(fezOrcamento(0, 1000)).toBe(false);
  });
  it("estourou após o limite", () => {
    expect(fezOrcamento(0, 240_001)).toBe(true);
  });
});

describe("formatarDataFinal", () => {
  it("formata AAAAMMDD", () => {
    expect(formatarDataFinal(new Date("2026-08-13T12:00:00Z"))).toBe("20260813");
  });
});

describe("combinações padrão", () => {
  it("cobre cada UF com dispensa e pregão", () => {
    const combos = combinacoesPadrao();
    expect(combos.length).toBe(8 * 2);
    expect(combos).toContainEqual({ uf: "SP", modalidadeId: 8 });
    expect(combos).toContainEqual({ uf: "SP", modalidadeId: 6 });
  });
});
