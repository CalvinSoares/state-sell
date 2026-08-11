import { describe, expect, it } from "vitest";
import { mascararEmail } from "./mascarar";

describe("mascararEmail", () => {
  it("mostra só os dois primeiros caracteres do usuário", () => {
    expect(mascararEmail("cleide@marmita.com")).toBe("cl****@marmita.com");
  });

  it("preserva o domínio", () => {
    expect(mascararEmail("ab@x.com.br")).toMatch(/@x\.com\.br$/);
  });

  it("lida com entrada inesperada sem vazar", () => {
    expect(mascararEmail("semarroba")).toBe("***");
  });
});
