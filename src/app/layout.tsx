import type { Metadata } from "next";
import { Figtree, Young_Serif } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/loja/site-header";
import { SiteFooter } from "@/components/loja/site-footer";
import { BottomNav } from "@/components/loja/bottom-nav";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Juliana Cestas | Cestas de café da manhã em Brasília",
  description:
    "Detalhes que encantam, sabores que emocionam, amor que se celebra. Cestas de café da manhã artesanais em Brasília, com cartão de mensagem personalizado em cada pedido.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${figtree.variable} ${youngSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <noscript>
          <style>{`.jc-reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <SiteHeader />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
