import { describe, expect, it } from "vitest";
import { RAMOS } from "@/content/ramos";
import { normalizar } from "./normalizar";
import { casar, melhorRamo } from "./casar";

describe("normalizar", () => {
  it("remove acento, pontuação e caixa", () => {
    expect(normalizar("AQUISIÇÃO DE REFEIÇÕES/QUENTINHAS")).toBe(
      "aquisicao de refeicoes quentinhas",
    );
  });

  it("colapsa espaços múltiplos", () => {
    expect(normalizar("a   b\t c")).toBe("a b c");
  });
});

describe("integridade do catálogo", () => {
  it("todo termo é igual à sua própria normalização", () => {
    const problemas: string[] = [];
    for (const ramo of RAMOS) {
      const todos = [
        ...ramo.termosFortes,
        ...ramo.termos,
        ...ramo.excluir,
        ...(ramo.alertaDeEscala ?? []),
        ...(ramo.unidadesEsperadas ?? []),
      ];
      for (const termo of todos) {
        if (normalizar(termo) !== termo) {
          problemas.push(`${ramo.slug}: "${termo}" → "${normalizar(termo)}"`);
        }
      }
    }
    expect(problemas, `termos não normalizados:\n${problemas.join("\n")}`).toEqual([]);
  });

  it("nenhum termo tem menos de 3 caracteres", () => {
    const curtos: string[] = [];
    for (const ramo of RAMOS) {
      for (const termo of [...ramo.termosFortes, ...ramo.termos]) {
        if (termo.length < 3) curtos.push(`${ramo.slug}: "${termo}"`);
      }
    }
    expect(curtos).toEqual([]);
  });
});

describe("casar", () => {
  it("veto é absoluto: hortifruti da agricultura familiar não é marmitaria", () => {
    const r = casar(
      {
        descricaoItem: "ABOBRINHA IN NATURA",
        objetoCompra: "GÊNEROS ALIMENTÍCIOS DA AGRICULTURA FAMILIAR PARA ALIMENTAÇÃO ESCOLAR",
      },
      RAMOS,
    );
    expect(r.find((c) => c.ramo === "alimentacao")).toBeUndefined();
  });

  it("classifica a marmita canônica como alimentação", () => {
    const c = melhorRamo(
      {
        descricaoItem: "Fornecimento de refeições transportadas tipo quentinha",
        objetoCompra: "AQUISIÇÃO DE REFEIÇÕES PRONTAS",
      },
      RAMOS,
    );
    expect(c?.ramo).toBe("alimentacao");
    expect(c?.termosCasados.length).toBeGreaterThan(0);
  });

  it("casar é puro: mesma entrada, mesma saída", () => {
    const entrada = {
      descricaoItem: "Switch 24 portas gigabit ethernet",
      objetoCompra: "Aquisição de material de rede",
    };
    expect(casar(entrada, RAMOS)).toEqual(casar(entrada, RAMOS));
  });

  it("marca escala quando o termo de escala aparece", () => {
    const c = melhorRamo(
      {
        descricaoItem: "Fornecimento de refeições transportadas para unidades hospitalares",
        objetoCompra: "REFEIÇÕES PRONTAS",
      },
      RAMOS,
    );
    expect(c?.ramo).toBe("alimentacao");
    expect(c?.escala).toBe(true);
  });
});
