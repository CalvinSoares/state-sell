import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.spec.ts", "scripts/**/*.spec.ts"],
    environment: "node",
    // O CI nunca chama o PNCP. Rede em teste é flakiness garantida.
    // Ver docs/base-de-conhecimentos/testes/fluxos-criticos.md
  },
});
