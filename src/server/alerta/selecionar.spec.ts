import { describe, expect, it } from "vitest";
import {
  aplicarTetoDiario,
  escolherItemPrincipal,
  selecionarPara,
  type ContratacaoParaSelecao,
  type ItemClassificado,
  type PerfilAssinante,
  type Selecao,
} from "./selecionar";

const AGORA = new Date("2026-08-11T12:00:00-03:00");
const PRAZO_OK = new Date("2026-08-16T09:00:00-03:00"); // ~5 dias

function item(over: Partial<ItemClassificado>): ItemClassificado {
  return {
    itemId: "i1",
    ramoSlug: "alimentacao",
    score: 0.8,
    valorTotalCentavos: 1_000_000n,
    exclusivoMeEpp: false,
    ...over,
  };
}

function contratacao(over: Partial<ContratacaoParaSelecao>): ContratacaoParaSelecao {
  return {
    contratacaoId: "c1",
    codigoIbge: "3552205",
    uf: "SP",
    valorTotalEstimadoCentavos: 3_840_000n,
    situacaoCompraId: 1,
    dataEncerramentoProposta: PRAZO_OK,
    itens: [item({})],
    ...over,
  };
}

function perfil(over: Partial<PerfilAssinante>): PerfilAssinante {
  return {
    assinanteId: "a1",
    ramos: ["alimentacao"],
    municipiosIbge: ["3552205"],
    uf: "SP",
    tetoValorCentavos: 8_000_000n,
    ...over,
  };
}

describe("selecionarPara", () => {
  it("seleciona quando ramo, município, teto e prazo batem", () => {
    const s = selecionarPara(contratacao({}), perfil({}), AGORA);
    expect(s?.assinanteId).toBe("a1");
    expect(s?.ramoSlug).toBe("alimentacao");
  });

  it("barra se o município não está no perfil", () => {
    const s = selecionarPara(contratacao({ codigoIbge: "9999999" }), perfil({}), AGORA);
    expect(s).toBeNull();
  });

  it("plano estado inteiro (sem municípios) casa por UF", () => {
    const s = selecionarPara(
      contratacao({ codigoIbge: "3500000", uf: "SP" }),
      perfil({ municipiosIbge: [], uf: "SP" }),
      AGORA,
    );
    expect(s).not.toBeNull();
  });

  it("barra acima do teto do assinante", () => {
    const s = selecionarPara(
      contratacao({ valorTotalEstimadoCentavos: 90_000_00n }),
      perfil({ tetoValorCentavos: 5_000_00n }),
      AGORA,
    );
    expect(s).toBeNull();
  });

  it("barra com menos de 24h de prazo", () => {
    const s = selecionarPara(
      contratacao({ dataEncerramentoProposta: new Date("2026-08-11T20:00:00-03:00") }),
      perfil({}),
      AGORA,
    );
    expect(s).toBeNull();
  });

  it("barra se a situação não é divulgada", () => {
    expect(selecionarPara(contratacao({ situacaoCompraId: 2 }), perfil({}), AGORA)).toBeNull();
  });

  it("barra se nenhum item é do ramo do perfil", () => {
    const s = selecionarPara(
      contratacao({ itens: [item({ ramoSlug: "informatica" })] }),
      perfil({ ramos: ["alimentacao"] }),
      AGORA,
    );
    expect(s).toBeNull();
  });

  it("valor nulo não é tratado como zero (não barra por teto)", () => {
    const s = selecionarPara(
      contratacao({ valorTotalEstimadoCentavos: null, itens: [item({ valorTotalCentavos: null })] }),
      perfil({ tetoValorCentavos: 1_000_00n }),
      AGORA,
    );
    expect(s).not.toBeNull();
  });
});

describe("escolherItemPrincipal", () => {
  it("prioriza item exclusivo ME/EPP mesmo com valor menor", () => {
    const escolhido = escolherItemPrincipal([
      item({ itemId: "caro", valorTotalCentavos: 9_000_000n, exclusivoMeEpp: false }),
      item({ itemId: "exclusivo", valorTotalCentavos: 1_000_000n, exclusivoMeEpp: true }),
    ]);
    expect(escolhido?.itemId).toBe("exclusivo");
  });

  it("entre iguais, maior valor vence", () => {
    const escolhido = escolherItemPrincipal([
      item({ itemId: "a", valorTotalCentavos: 100n }),
      item({ itemId: "b", valorTotalCentavos: 200n }),
    ]);
    expect(escolhido?.itemId).toBe("b");
  });
});

describe("aplicarTetoDiario", () => {
  function sel(over: Partial<Selecao>): Selecao {
    return {
      assinanteId: "a1",
      contratacaoId: "c",
      ramoSlug: "alimentacao",
      itemIdPrincipal: "i",
      exclusivoMeEpp: false,
      prioridade: 500,
      dataEncerramentoProposta: PRAZO_OK,
      ...over,
    };
  }

  it("no máximo 5 por assinante nesta leva; resto é adiado", () => {
    const selecoes = Array.from({ length: 8 }, (_, i) =>
      sel({ contratacaoId: `c${i}`, prioridade: i }),
    );
    const { enviarAgora, adiar } = aplicarTetoDiario(selecoes);
    expect(enviarAgora).toHaveLength(5);
    expect(adiar).toHaveLength(3);
  });

  it("envia os de maior prioridade (menor número) primeiro", () => {
    const selecoes = [
      sel({ contratacaoId: "baixa", prioridade: 900 }),
      sel({ contratacaoId: "alta", prioridade: 10 }),
    ];
    const { enviarAgora } = aplicarTetoDiario(selecoes);
    expect(enviarAgora[0]!.contratacaoId).toBe("alta");
  });

  it("tetos são por assinante, não globais", () => {
    const selecoes = [
      ...Array.from({ length: 6 }, (_, i) => sel({ assinanteId: "a", contratacaoId: `a${i}` })),
      ...Array.from({ length: 6 }, (_, i) => sel({ assinanteId: "b", contratacaoId: `b${i}` })),
    ];
    const { enviarAgora } = aplicarTetoDiario(selecoes);
    expect(enviarAgora.filter((s) => s.assinanteId === "a")).toHaveLength(5);
    expect(enviarAgora.filter((s) => s.assinanteId === "b")).toHaveLength(5);
  });
});
