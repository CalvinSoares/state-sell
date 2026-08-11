import { describe, expect, it } from "vitest";
import { quantidadeTexto, valorAproximado } from "./formatador";
import { diasRestantes, horasRestantes, prazoTexto } from "./data";

describe("valorAproximado", () => {
  it("dezenas de milhar arredonda para 'mil'", () => {
    expect(valorAproximado(3_840_000n)).toBe("por volta de R$ 38 mil"); // R$ 38.400
  });
  it("milhares baixos usa uma casa", () => {
    expect(valorAproximado(936_000n)).toBe("por volta de R$ 9,4 mil"); // R$ 9.360
  });
  it("centenas", () => {
    expect(valorAproximado(85_000n)).toBe("cerca de R$ 850");
  });
  it("milhão", () => {
    expect(valorAproximado(120_000_000n)).toBe("por volta de R$ 1,2 milhão");
  });
  it("nulo ou zero vira null", () => {
    expect(valorAproximado(null)).toBeNull();
    expect(valorAproximado(0n)).toBeNull();
  });
});

describe("quantidadeTexto", () => {
  it("inteiro com unidade", () => {
    expect(quantidadeTexto(400, "refeições")).toBe("400 refeições");
  });
  it("milhar com separador pt-BR", () => {
    expect(quantidadeTexto(1250, "maço")).toBe("1.250 maço");
  });
  it("sem quantidade vira null", () => {
    expect(quantidadeTexto(null, "x")).toBeNull();
  });
});

describe("data", () => {
  const agora = new Date("2026-08-11T12:00:00-03:00");

  it("dias restantes", () => {
    expect(diasRestantes(new Date("2026-08-14T12:00:00-03:00"), agora)).toBe(3);
  });

  it("horas restantes negativas quando o prazo passou", () => {
    expect(horasRestantes(new Date("2026-08-11T09:00:00-03:00"), agora)).toBeLessThan(0);
  });

  it("prazoTexto traz dia da semana, data, hora e contagem", () => {
    const prazo = new Date("2026-08-14T09:00:00-03:00"); // sexta
    const txt = prazoTexto(prazo, agora);
    expect(txt).toContain("14/08");
    expect(txt).toContain("9h");
    expect(txt).toContain("faltam 3 dias");
  });

  it("prazoTexto no mesmo dia fala em horas", () => {
    const prazo = new Date("2026-08-11T18:00:00-03:00");
    expect(prazoTexto(prazo, agora)).toContain("poucas horas");
  });
});
