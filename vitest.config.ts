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
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
