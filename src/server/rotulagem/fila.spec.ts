import { describe, expect, it } from "vitest";
import { hashTexto } from "./hash";
import { montarFila, type Candidato } from "./fila";

function cand(over: Partial<Candidato>): Candidato {
  return {
    hashTexto: "ff000000",
    itemId: "i",
    descricaoItem: "d",
    objetoCompra: "o",
    unidadeMedida: null,
    municipioNome: "Cidade",
    score: null,
    ramoSugerido: null,
    temFeedbackNegativo: false,
    ...over,
  };
}

describe("hashTexto", () => {
  it("é estável e ignora acento/caixa/pontuação", () => {
    expect(hashTexto("REFEIÇÃO/QUENTINHA", "Objeto")).toBe(
      hashTexto("refeicao quentinha", "objeto"),
    );
  });
  it("textos diferentes geram hashes diferentes", () => {
    expect(hashTexto("marmita", "x")).not.toBe(hashTexto("impressora", "x"));
  });
});

describe("montarFila", () => {
  it("feedback negativo é priorizado", () => {
    const fila = montarFila(
      [
        cand({ itemId: "a", score: 0.9, ramoSugerido: "alimentacao" }),
        cand({ itemId: "b", temFeedbackNegativo: true }),
      ],
      2,
    );
    expect(fila[0]!.origemAmostra).toBe("feedback");
  });

  it("marca origem aleatória para hash no bucket aleatório", () => {
    // hash começando com '00' → amostra aleatória
    const fila = montarFila([cand({ itemId: "r", hashTexto: "00abcdef" })], 1);
    expect(fila[0]!.origemAmostra).toBe("aleatoria");
  });

  it("item perto do limiar vira caso dirigido", () => {
    const fila = montarFila(
      [cand({ itemId: "l", hashTexto: "ffabcdef", score: 0.6, ramoSugerido: "grafica" })],
      1,
    );
    expect(fila[0]!.origemAmostra).toBe("dirigida");
  });

  it("respeita o tamanho pedido", () => {
    const muitos = Array.from({ length: 100 }, (_, i) =>
      cand({ itemId: String(i), hashTexto: `ff0000${i % 10}0` }),
    );
    expect(montarFila(muitos, 10).length).toBe(10);
  });

  it("inclui as quatro origens quando há candidatos de cada bucket", () => {
    const fila = montarFila(
      [
        cand({ itemId: "fb", temFeedbackNegativo: true }),
        cand({ itemId: "lim", hashTexto: "ff000000", score: 0.6, ramoSugerido: "grafica" }),
        cand({ itemId: "sem", hashTexto: "ff000001", score: null, ramoSugerido: null }),
        cand({ itemId: "ale", hashTexto: "01000000", score: null, ramoSugerido: null }),
      ],
      4,
    );
    const origens = new Set(fila.map((f) => f.origemAmostra));
    expect(origens.has("feedback")).toBe(true);
    expect(origens.has("aleatoria")).toBe(true);
    expect(origens.has("dirigida")).toBe(true);
  });
});
