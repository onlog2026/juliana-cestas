import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Só unitários aqui. E2E é Playwright (tests/e2e), isolamento é script
    // (tests/isolation) -- cada um roda com seu próprio comando.
    include: ["tests/unit/**/*.test.ts", "src/**/*.test.ts"],
    environment: "node",
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` existe só para o compilador do Next barrar import errado.
      // Em teste ele lança na hora do import; trocamos por um módulo vazio.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
});
