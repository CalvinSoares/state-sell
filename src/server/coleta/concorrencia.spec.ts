import { describe, expect, it } from "vitest";
import { comConcorrencia } from "./concorrencia";

describe("comConcorrencia", () => {
  it("preserva ordem dos resultados", async () => {
    const r = await comConcorrencia([1, 2, 3, 4, 5], 2, async (n) => n * 10);
    expect(r).toEqual([10, 20, 30, 40, 50]);
  });

  it("nunca ultrapassa o limite de concorrência", async () => {
    let emVoo = 0;
    let pico = 0;
    await comConcorrencia(Array.from({ length: 20 }), 3, async () => {
      emVoo++;
      pico = Math.max(pico, emVoo);
      await new Promise((r) => setTimeout(r, 5));
      emVoo--;
    });
    expect(pico).toBeLessThanOrEqual(3);
  });

  it("lida com lista vazia", async () => {
    expect(await comConcorrencia([], 5, async (x) => x)).toEqual([]);
  });
});
