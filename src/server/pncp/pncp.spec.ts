import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { EnvelopeConsulta, ListaItensPncp } from "./schemas";
import {
  dataLocalPncpParaDate,
  mapearContratacao,
  mapearItem,
  reaisParaCentavos,
} from "./mapeadores";

const AQUI = dirname(fileURLToPath(import.meta.url));
const fixture = (nome: string) =>
  JSON.parse(readFileSync(join(AQUI, "../../../fixtures/pncp", nome), "utf-8"));

describe("schema do PNCP (fixtures reais congeladas)", () => {
  it("aceita resposta real de /contratacoes/proposta", () => {
    const r = EnvelopeConsulta.safeParse(fixture("contratacoes-abertas.json"));
    expect(r.success).toBe(true);
  });

  it("aceita itens reais", () => {
    const r = ListaItensPncp.safeParse(fixture("itens.json"));
    expect(r.success).toBe(true);
  });

  it("aceita itens com campos nulos (borda)", () => {
    const r = ListaItensPncp.safeParse(fixture("itens-nulos.json"));
    expect(r.success).toBe(true);
  });

  it("REJEITA resposta com campos obrigatórios faltando", () => {
    const r = EnvelopeConsulta.safeParse(fixture("resposta-invalida.json"));
    expect(r.success).toBe(false);
  });
});

describe("mapeadores", () => {
  it("reais → centavos sem erro de ponto flutuante", () => {
    expect(reaisParaCentavos(93241.5)).toBe(9324150n);
    expect(reaisParaCentavos(0.1)).toBe(10n);
    expect(reaisParaCentavos(null)).toBeNull();
  });

  it("data local sem offset é interpretada como America/Sao_Paulo", () => {
    const d = dataLocalPncpParaDate("2026-08-13T23:59:00");
    // 23:59 em -03:00 é 02:59Z do dia seguinte
    expect(d?.toISOString()).toBe("2026-08-14T02:59:00.000Z");
  });

  it("data nula devolve null, não epoch", () => {
    expect(dataLocalPncpParaDate(null)).toBeNull();
    expect(dataLocalPncpParaDate(undefined)).toBeNull();
  });

  it("mapeia contratação real e preserva o bruto", () => {
    const env = EnvelopeConsulta.parse(fixture("contratacoes-abertas.json"));
    const primeira = env.data[0]!;
    const m = mapearContratacao(primeira);
    expect(m.numeroControlePncp).toBe(primeira.numeroControlePNCP);
    expect(m.uf).toBe(primeira.unidadeOrgao.ufSigla);
    expect(m.bruto).toBe(primeira);
  });

  it("link 'SEM PUBLICAÇÃO' vira null", () => {
    const env = EnvelopeConsulta.parse(fixture("contratacoes-abertas.json"));
    const base = env.data[0]!;
    const m = mapearContratacao({ ...base, linkSistemaOrigem: "SEM PUBLICAÇÃO" });
    expect(m.linkSistemaOrigem).toBeNull();
  });

  it("mapeia item e deriva exclusivoMeEpp do tipoBeneficioNome", () => {
    const itens = ListaItensPncp.parse(fixture("itens.json"));
    const m = mapearItem({ ...itens[0]!, tipoBeneficioNome: "Participação exclusiva para ME/EPP" });
    expect(m.exclusivoMeEpp).toBe(true);
    const semBeneficio = mapearItem({ ...itens[0]!, tipoBeneficioNome: "Sem benefício" });
    expect(semBeneficio.exclusivoMeEpp).toBe(false);
  });
});
