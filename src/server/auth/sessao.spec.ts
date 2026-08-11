import { describe, expect, it } from "vitest";
import { assinarSessao, verificarSessao } from "./sessao";

const SEGREDO = "segredo-de-teste-nao-usar-em-producao";
const AGORA = 1_700_000_000_000;

describe("sessão assinada", () => {
  it("assina e verifica o mesmo e-mail", async () => {
    const token = await assinarSessao("Admin@Empresa.com", SEGREDO, AGORA);
    expect(await verificarSessao(token, SEGREDO, AGORA)).toBe("admin@empresa.com");
  });

  it("rejeita token expirado", async () => {
    const token = await assinarSessao("a@b.com", SEGREDO, AGORA);
    const depois = AGORA + 1000 * 60 * 60 * 13; // > 12h
    expect(await verificarSessao(token, SEGREDO, depois)).toBeNull();
  });

  it("rejeita assinatura adulterada", async () => {
    const token = await assinarSessao("a@b.com", SEGREDO, AGORA);
    const adulterado = token.slice(0, -3) + "xxx";
    expect(await verificarSessao(adulterado, SEGREDO, AGORA)).toBeNull();
  });

  it("rejeita segredo diferente", async () => {
    const token = await assinarSessao("a@b.com", SEGREDO, AGORA);
    expect(await verificarSessao(token, "outro-segredo", AGORA)).toBeNull();
  });

  it("rejeita token ausente ou malformado", async () => {
    expect(await verificarSessao(undefined, SEGREDO, AGORA)).toBeNull();
    expect(await verificarSessao("sem-ponto", SEGREDO, AGORA)).toBeNull();
  });
});
