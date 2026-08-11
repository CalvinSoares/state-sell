import { describe, expect, it } from "vitest";
import { comporEmail, linkDoEdital, type DadosContratacao, type DadosItemPrincipal } from "./compor";

describe("linkDoEdital", () => {
  it("usa o link do sistema de origem quando é URL real", () => {
    expect(linkDoEdital("https://compras.sorocaba.sp.gov.br/x", "01572597000101-1-000158/2026")).toBe(
      "https://compras.sorocaba.sp.gov.br/x",
    );
  });
  it("monta deep-link do PNCP quando não há publicação", () => {
    expect(linkDoEdital("SEM PUBLICAÇÃO", "01572597000101-1-000158/2026")).toBe(
      "https://pncp.gov.br/app/editais/01572597000101/2026/158",
    );
  });
  it("deep-link também quando o link é nulo", () => {
    expect(linkDoEdital(null, "01572597000101-1-000158/2026")).toContain(
      "/app/editais/01572597000101/2026/158",
    );
  });
  it("cai no genérico se o número de controle for inesperado", () => {
    expect(linkDoEdital(null, "formato-estranho")).toBe("https://pncp.gov.br/app/editais");
  });
});

const AGORA = new Date("2026-08-11T12:00:00-03:00");
const APP = "https://prefeituraquer.com.br";

function contratacao(over: Partial<DadosContratacao> = {}): DadosContratacao {
  return {
    orgaoRazaoSocial: "MUNICIPIO DE SOROCABA",
    municipioNome: "Sorocaba",
    unidadeNome: "EMEI Jardim Paulista",
    valorTotalEstimadoCentavos: 3_840_000n,
    dataEncerramentoProposta: new Date("2026-08-14T09:00:00-03:00"),
    linkSistemaOrigem: "https://compras.sorocaba.sp.gov.br/edital/127",
    numeroControlePncp: "x-1-000158/2026",
    ...over,
  };
}

function item(over: Partial<DadosItemPrincipal> = {}): DadosItemPrincipal {
  return {
    descricao: "Fornecimento de refeições transportadas, tipo: quentinha",
    quantidade: 400,
    unidadeMedida: "refeições",
    exclusivoMeEpp: true,
    escala: false,
    ...over,
  };
}

describe("comporEmail", () => {
  it("monta título humano sem jargão", () => {
    const e = comporEmail(contratacao(), item(), "Alimentação / marmitaria", ["quentinha"], APP, AGORA);
    expect(e.titulo).toBe("A Prefeitura de Sorocaba quer comprar alimentação.");
  });

  it("órgão não-municipal NÃO vira 'Prefeitura de ...'", () => {
    const e = comporEmail(
      contratacao({ orgaoRazaoSocial: "SECRETARIA DA HABITACAO", municipioNome: "São Paulo" }),
      item(),
      "Gráfica e impressos",
      [],
      APP,
      AGORA,
    );
    expect(e.titulo).not.toContain("Prefeitura de Secretaria");
    expect(e.titulo).toContain("Secretaria da Habitacao");
  });

  it("assunto tem órgão, ramo e dia da semana, sem 'modalidade'", () => {
    const e = comporEmail(contratacao(), item(), "Alimentação / marmitaria", [], APP, AGORA);
    expect(e.assunto).toContain("Sorocaba");
    expect(e.assunto).toContain("alimentação");
    expect(e.assunto.toLowerCase()).not.toContain("modalidade");
    expect(e.assunto.toLowerCase()).not.toContain("dispensa");
  });

  it("inclui a linha de exclusividade SÓ quando o dado diz", () => {
    const com = comporEmail(contratacao(), item({ exclusivoMeEpp: true }), "Alimentação", [], APP, AGORA);
    expect(com.linhas.some((l) => l.includes("micro e pequena empresa"))).toBe(true);

    const sem = comporEmail(contratacao(), item({ exclusivoMeEpp: false }), "Alimentação", [], APP, AGORA);
    expect(sem.linhas.some((l) => l.includes("micro e pequena empresa"))).toBe(false);
  });

  it("valor nulo omite a linha de valor (nunca 'não informado')", () => {
    const e = comporEmail(
      contratacao({ valorTotalEstimadoCentavos: null }),
      item(),
      "Alimentação",
      [],
      APP,
      AGORA,
    );
    expect(e.linhas.some((l) => l.toLowerCase().includes("não informado"))).toBe(false);
    expect(e.linhas.some((l) => l.startsWith("Valor estimado"))).toBe(false);
  });

  it("prazo tem dia da semana e contagem", () => {
    const e = comporEmail(contratacao(), item(), "Alimentação", [], APP, AGORA);
    expect(e.prazo).toContain("14/08");
    expect(e.prazo).toContain("faltam 3 dias");
  });

  it("usa o link do sistema de origem quando existe", () => {
    const e = comporEmail(contratacao(), item(), "Alimentação", [], APP, AGORA);
    expect(e.verEditalUrl).toBe("https://compras.sorocaba.sp.gov.br/edital/127");
  });

  it("cai no PNCP quando não há link de origem", () => {
    const e = comporEmail(
      contratacao({ linkSistemaOrigem: null }),
      item(),
      "Alimentação",
      [],
      APP,
      AGORA,
    );
    expect(e.verEditalUrl).toContain("pncp.gov.br");
  });

  it("aviso de escala aparece quando o item exige estrutura grande", () => {
    const e = comporEmail(contratacao(), item({ escala: true }), "Alimentação", [], APP, AGORA);
    expect(e.avisoEscala).toContain("estrutura grande");
  });

  it("corta atributos CATMAT no nome do item", () => {
    const e = comporEmail(
      contratacao(),
      item({ descricao: "Switch quantidade portas: 24, tipo: gigabit", quantidade: 3, unidadeMedida: "unidade" }),
      "Informática",
      [],
      APP,
      AGORA,
    );
    expect(e.linhas[0]).toContain("switch");
    expect(e.linhas[0]).not.toContain("portas: 24");
  });

  it("rodapé explica por que o alerta chegou", () => {
    const e = comporEmail(contratacao(), item(), "Alimentação", ["quentinha", "marmita"], APP, AGORA);
    expect(e.porque).toContain("Sorocaba");
    expect(e.porque).toContain("quentinha");
  });
});
