import type { Metadata } from "next";
import { Figtree, Young_Serif, Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";

/**
 * Layout RAIZ -- só o que vale para o site inteiro: fontes, estilos e
 * analytics.
 *
 * O cabeçalho, o rodapé e a barra de baixo da LOJA vivem em
 * `src/app/(store)/layout.tsx`. Antes moravam aqui, e por isso apareciam
 * também por cima do painel do lojista e do painel da plataforma -- dava para
 * ver o cabeçalho da loja sobrepondo o menu do admin. Painel não é vitrine.
 */

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  weight: "400",
  subsets: ["latin"],
});

// Fontes extras só pros textos de banner (CMS) -- mais variedade além das
// duas fontes de marca do site.
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "600"],
  subsets: ["latin"],
});

// Metadados específicos da loja ficam em (store)/layout.tsx -- aqui só o que
// não depende de qual loja (nem de haver uma).
export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${figtree.variable} ${youngSerif.variable} ${playfairDisplay.variable} ${poppins.variable} h-full overflow-x-clip antialiased`}
    >
      {/* `overflow-x-clip` no <html> (não só no body) é o que de fato contém a
          rolagem horizontal da PÁGINA no iOS Safari -- lá o guard só no body
          não segura, e qualquer filho que role de propósito (uma faixa de
          chips, uma tabela larga) fazia a página inteira deslizar. É `clip`,
          não `hidden`, porque `hidden` cria um contêiner de rolagem que quebra
          o `position: sticky` do cabeçalho da loja; `clip` corta sem isso, e
          com o eixo Y visível a rolagem vertical/sticky da viewport continua. */}
      <body className="flex min-h-full flex-col overflow-x-clip bg-background text-foreground">
        <noscript>
          <style>{`.jc-reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
