import { defineConfig } from "@playwright/test";

// Roda contra qualquer ambiente: BASE_URL=https://www.julianacesta.com.br
// (produção, depois de cada deploy) ou http://localhost:3010 (dev). Não sobe
// servidor sozinho de propósito -- o critério é "o que está no ar responde".
const baseURL = process.env.BASE_URL ?? "http://localhost:3010";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
