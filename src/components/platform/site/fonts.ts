import { Bricolage_Grotesque, DM_Sans } from "next/font/google";

/**
 * Fontes da identidade da plataforma. `preload: false` de propósito: são carregadas só quando o
 * site da plataforma usa (nunca na loja de ninguém), e sem puxar a rede antes da hora.
 * As variáveis `--p-font-*` são lidas em `src/styles/plataforma.css`.
 */
export const fonteDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--p-font-display",
});

export const fonteTexto = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--p-font-body",
});
