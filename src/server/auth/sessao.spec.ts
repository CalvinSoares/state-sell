import { describe, expect, it } from "vitest";
import { assinarSessao, verificarSessao } from "./sessao";

const SEGREDO = "segredo-de-teste-nao-usar-em-producao";
const AGORA = 1_700_000_000_000;

describe("sessão assinada", () => {
  it("assina e verifica o mesmo e-mail (audiência bate)", async () => {
    const token = await assinarSessao("Admin@Empresa.com", SEGREDO, AGORA, { aud: "admin" });
    expect(await verificarSessao(token, SEGREDO, AGORA, "admin")).toBe("admin@empresa.com");
  });

  it("rejeita token de outra audiência (assinante ≠ admin)", async () => {
    const token = await assinarSessao("a@b.com", SEGREDO, AGORA, { aud: "assinante" });
    expect(await verificarSessao(token, SEGREDO, AGORA, "admin")).toBeNull();
    expect(await verificarSessao(token, SEGREDO, AGORA, "assinante")).toBe("a@b.com");
  });

  it("magic link não vale como sessão de assinante", async () => {
    const token = await assinarSessao("a@b.com", SEGREDO, AGORA, { aud: "magic" });
    expect(await verificarSessao(token, SEGREDO, AGORA, "assinante")).toBeNull();
    expect(await verificarSessao(token, SEGREDO, AGORA, "magic")).toBe("a@b.com");
  });

  it("rejeita token expirado", async () => {
    const token = await assinarSessao("a@b.com", SEGREDO, AGORA, { aud: "assinante" });
    const depois = AGORA + 1000 * 60 * 60 * 13; // > 12h
    expect(await verificarSessao(token, SEGREDO, depois, "assinante")).toBeNull();
  });

  it("rejeita assinatura adulterada", async () => {
    const token = await assinarSessao("a@b.com", SEGREDO, AGORA, { aud: "assinante" });
    const adulterado = token.slice(0, -3) + "xxx";
    expect(await verificarSessao(adulterado, SEGREDO, AGORA, "assinante")).toBeNull();
  });

  it("rejeita segredo diferente", async () => {
    const token = await assinarSessao("a@b.com", SEGREDO, AGORA, { aud: "assinante" });
    expect(await verificarSessao(token, "outro-segredo", AGORA, "assinante")).toBeNull();
  });

  it("rejeita token ausente ou malformado", async () => {
    expect(await verificarSessao(undefined, SEGREDO, AGORA, "assinante")).toBeNull();
    expect(await verificarSessao("sem-ponto", SEGREDO, AGORA, "assinante")).toBeNull();
  });
});
