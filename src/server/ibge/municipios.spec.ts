import { describe, expect, it } from "vitest";
import { buscarMunicipios, municipioPorCodigo, totalMunicipios } from "./municipios";

describe("base de municípios IBGE", () => {
  it("carrega os 5.571 municípios", () => {
    expect(totalMunicipios()).toBe(5571);
  });

  it("acha Sorocaba em SP e traz o código IBGE certo", () => {
    const r = buscarMunicipios("SP", "soroca");
    expect(r[0]?.codigoIbge).toBe("3552205");
    expect(r[0]?.nome).toBe("Sorocaba");
  });

  it("ignora acento e caixa", () => {
    const r = buscarMunicipios("SP", "SÃO paulo");
    expect(r.some((m) => m.nome === "São Paulo")).toBe(true);
  });

  it("prioriza quem começa com o termo", () => {
    const r = buscarMunicipios("SP", "santos");
    expect(r[0]?.nome).toBe("Santos");
  });

  it("filtra pela UF pedida", () => {
    const r = buscarMunicipios("MG", "sorocaba");
    expect(r).toHaveLength(0); // Sorocaba é SP, não MG
  });

  it("termo curto demais não busca", () => {
    expect(buscarMunicipios("SP", "s")).toHaveLength(0);
  });

  it("respeita o limite", () => {
    expect(buscarMunicipios("SP", "sa", 5).length).toBeLessThanOrEqual(5);
  });

  it("busca município por código", () => {
    expect(municipioPorCodigo("3554755")?.nome).toBe("Trabiju");
  });
});
