import { describe, expect, it } from "vitest";
import { avisoCertidaoNoAlerta, sinaisValeOlhar } from "./sinais";

const AGORA = new Date("2026-08-11T12:00:00-03:00");
const PRAZO = new Date("2026-08-14T09:00:00-03:00"); // faltam 3 dias

describe("sinaisValeOlhar", () => {
  it("afirma exclusividade só quando o dado diz", () => {
    const com = sinaisValeOlhar({
      exclusivoMeEpp: true,
      dataEncerramentoProposta: PRAZO,
      valorTotalEstimadoCentavos: 3_840_000n,
      tetoValorCentavos: 5_000_000n,
      agora: AGORA,
    });
    expect(com[0]!.ok).toBe(true);
    expect(com[0]!.texto.toLowerCase()).toContain("micro e pequena");

    const sem = sinaisValeOlhar({
      exclusivoMeEpp: false,
      dataEncerramentoProposta: PRAZO,
      valorTotalEstimadoCentavos: 3_840_000n,
      tetoValorCentavos: 5_000_000n,
      agora: AGORA,
    });
    expect(sem[0]!.ok).toBeNull();
    expect(sem[0]!.texto.toLowerCase()).toContain("não diz");
  });

  it("prazo em dias de calendário, sem jargão", () => {
    const s = sinaisValeOlhar({
      exclusivoMeEpp: true,
      dataEncerramentoProposta: PRAZO,
      valorTotalEstimadoCentavos: 1_000_000n,
      tetoValorCentavos: 2_000_000n,
      agora: AGORA,
    });
    expect(s[1]!.texto).toContain("faltam 3 dias");
  });

  it("diz se cabe na faixa da pessoa", () => {
    const ok = sinaisValeOlhar({
      exclusivoMeEpp: true,
      dataEncerramentoProposta: PRAZO,
      valorTotalEstimadoCentavos: 1_000_000n,
      tetoValorCentavos: 2_000_000n,
      agora: AGORA,
    });
    expect(ok[2]!.ok).toBe(true);
    expect(ok[2]!.texto.toLowerCase()).toContain("cabe na sua faixa");

    const acima = sinaisValeOlhar({
      exclusivoMeEpp: true,
      dataEncerramentoProposta: PRAZO,
      valorTotalEstimadoCentavos: 9_000_000n,
      tetoValorCentavos: 2_000_000n,
      agora: AGORA,
    });
    expect(acima[2]!.ok).toBe(false);
  });

  it("omite afirmação de faixa quando não há valor", () => {
    const s = sinaisValeOlhar({
      exclusivoMeEpp: false,
      dataEncerramentoProposta: PRAZO,
      valorTotalEstimadoCentavos: null,
      tetoValorCentavos: 2_000_000n,
      agora: AGORA,
    });
    expect(s[2]!.ok).toBeNull();
    expect(s[2]!.texto.toLowerCase()).toContain("não veio");
  });
});

describe("avisoCertidaoNoAlerta", () => {
  it("null quando não há certidão urgente", () => {
    expect(
      avisoCertidaoNoAlerta([{ tipo: "cnd_federal", vencimentoEm: "2026-12-01" }], AGORA),
    ).toBeNull();
  });

  it("avisa quando vence em até 15 dias", () => {
    const msg = avisoCertidaoNoAlerta(
      [{ tipo: "cnd_federal", vencimentoEm: "2026-08-20" }],
      AGORA,
    );
    expect(msg).toContain("vence em");
    expect(msg).toContain("Renove antes de disputar");
    expect(msg?.toLowerCase()).toContain("cnd");
  });

  it("avisa quando já venceu", () => {
    const msg = avisoCertidaoNoAlerta(
      [{ tipo: "fgts", vencimentoEm: "2026-08-01" }],
      AGORA,
    );
    expect(msg).toContain("vencida");
  });
});
