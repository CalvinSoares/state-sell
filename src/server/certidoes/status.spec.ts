import { describe, expect, it } from "vitest";
import { diasAteVencimento, lembreteDevido, situacaoCertidao } from "./status";

// "agora" fixo em SP: 11/08/2026
const AGORA = new Date("2026-08-11T15:00:00-03:00");

describe("diasAteVencimento", () => {
  it("conta dias de calendário", () => {
    expect(diasAteVencimento("2026-08-26", AGORA)).toBe(15);
    expect(diasAteVencimento("2026-08-14", AGORA)).toBe(3);
    expect(diasAteVencimento("2026-08-11", AGORA)).toBe(0);
    expect(diasAteVencimento("2026-08-10", AGORA)).toBe(-1);
  });
});

describe("situacaoCertidao", () => {
  it("ok acima de 15 dias", () => {
    expect(situacaoCertidao("2026-08-27", AGORA)).toBe("ok");
  });
  it("atenção em até 15 dias", () => {
    expect(situacaoCertidao("2026-08-26", AGORA)).toBe("atencao");
    expect(situacaoCertidao("2026-08-11", AGORA)).toBe("atencao");
  });
  it("vencida depois do dia informado", () => {
    expect(situacaoCertidao("2026-08-10", AGORA)).toBe("vencida");
  });
});

describe("lembreteDevido", () => {
  it("dispara d15 entre 4 e 15 dias", () => {
    expect(lembreteDevido("2026-08-26", AGORA, false, false)).toBe("d15");
    expect(lembreteDevido("2026-08-15", AGORA, false, false)).toBe("d15");
    expect(lembreteDevido("2026-08-26", AGORA, true, false)).toBe(null);
  });
  it("dispara d3 em 0..3 dias (mesmo se d15 faltou)", () => {
    expect(lembreteDevido("2026-08-14", AGORA, false, false)).toBe("d3");
    expect(lembreteDevido("2026-08-11", AGORA, true, false)).toBe("d3");
    expect(lembreteDevido("2026-08-14", AGORA, false, true)).toBe(null);
  });
  it("não manda depois de vencida", () => {
    expect(lembreteDevido("2026-08-10", AGORA, false, false)).toBe(null);
  });
  it("não manda antes da janela de 15 dias", () => {
    expect(lembreteDevido("2026-09-01", AGORA, false, false)).toBe(null);
  });
});
