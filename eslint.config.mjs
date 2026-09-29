import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Regra da casa: nada de janela nativa (confirm/alert/prompt) -- some no
  // celular e no app instalado. Use `useConfirm()` (components/ui/confirm-dialog).
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "confirm", message: "Use useConfirm() de components/ui/confirm-dialog." },
        { name: "alert", message: "Use um aviso no meio da tela, não alert()." },
        { name: "prompt", message: "Use useConfirm({ input }) de components/ui/confirm-dialog." },
      ],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "confirm", message: "Use useConfirm()." },
        { object: "window", property: "alert", message: "Use um aviso no meio da tela." },
        { object: "window", property: "prompt", message: "Use useConfirm({ input })." },
      ],
    },
  },
]);

export default eslintConfig;
