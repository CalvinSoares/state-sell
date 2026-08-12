import { describe, expect, it } from "vitest";
import { simularHistorico, type ContratacaoHistorica } from "./simular";
import type { PerfilAssinante } from "./selecionar";

const COLETA = new Date("2026-08-01T12:00:00-03:00");
const PRAZO_OK = new Date("2026-08-06T09:00:00-03:00"); // ainda >24h na coleta
const PRAZO_CURTO = new Date("2026-08-01T20:00:00-03:00"); // <24h na coleta

function perfil(over: Partial<PerfilAssinante> = {}): PerfilAssinante {
  return {
    assinanteId: "a1",
    ramos: ["alimentacao"],
    municipiosIbge: ["3552205"],
    uf: "SP",
    tetoValorCentavos: 8_000_000n,
    ...over,
  };
}

function candidata(over: Partial<ContratacaoHistorica> = {}): ContratacaoHistorica {
  return {
    contratacaoId: "c1",
    codigoIbge: "3552205",
    uf: "SP",
    valorTotalEstimadoCentavos: 3_840_000n,
    situacaoCompraId: 2, // hoje encerrada — simulação força 1
    dataEncerramentoProposta: PRAZO_OK,
    coletadoEm: COLETA,
    orgaoRazaoSocial: "PREFEITURA MUNICIPAL DE SOROCABA",
    municipioNome: "Sorocaba",
    itemDescricaoPorId: { i1: "Refeições transportadas" },
    itens: [
      {
        itemId: "i1",
        ramoSlug: "alimentacao",
        score: 0.9,
        valorTotalCentavos: 3_840_000n,
        exclusivoMeEpp: true,
      },
    ],
    ...over,
  };
}

describe("simularHistorico", () => {
  it("inclui contratação que batia com o perfil no momento da coleta", () => {
    const r = simularHistorico([candidata()], perfil());
    expect(r).toHaveLength(1);
    expect(r[0]!.ramoSlug).toBe("alimentacao");
    expect(r[0]!.itemDescricao).toBe("Refeições transportadas");
  });

  it("ignora prazo curto demais no momento da coleta", () => {
    const r = simularHistorico(
      [candidata({ dataEncerramentoProposta: PRAZO_CURTO })],
      perfil(),
    );
    expect(r).toHaveLength(0);
  });

  it("ignora fora da região", () => {
    const r = simularHistorico([candidata({ codigoIbge: "3550308", uf: "SP" })], perfil());
    expect(r).toHaveLength(0);
  });

  it("ignora ramo que o perfil não cobre", () => {
    const r = simularHistorico([candidata()], perfil({ ramos: ["grafica"] }));
    expect(r).toHaveLength(0);
  });
});
