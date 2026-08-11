import { describe, expect, it } from "vitest";
import { decidirEnvio } from "./decidir-envio";

describe("decidirEnvio — trava anti-disparo", () => {
  it("envia de verdade só em produção + live + api key", () => {
    expect(decidirEnvio("production", "live", true).enviarDeVerdade).toBe(true);
  });

  it("NÃO envia fora de produção, mesmo com live", () => {
    expect(decidirEnvio("development", "live", true).enviarDeVerdade).toBe(false);
    expect(decidirEnvio("test", "live", true).enviarDeVerdade).toBe(false);
  });

  it("NÃO envia em produção se o modo não é live", () => {
    expect(decidirEnvio("production", "dry", true).enviarDeVerdade).toBe(false);
  });

  it("NÃO envia sem api key", () => {
    expect(decidirEnvio("production", "live", false).enviarDeVerdade).toBe(false);
  });
});
