import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { benefits } from "@/lib/mock-content";
import { WhatsappCta } from "@/components/loja/whatsapp-cta";

export const metadata: Metadata = {
  title: "Sobre a Juliana Cestas | Juliana Cestas",
  description:
    "Cestas de café da manhã e presentes afetivos, feitos à mão em Brasília, com cartão de mensagem personalizado em cada pedido.",
};

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Sobre a Juliana Cestas</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl text-foreground md:text-4xl">
        Sobre a Juliana Cestas
      </h1>
      <p className="mt-4 font-display text-xl leading-relaxed text-foreground">
        Detalhes que encantam, sabores que emocionam, amor que se celebra.
      </p>
      <p className="mt-4 text-muted-foreground">
        A Juliana Cestas monta cestas de café da manhã e presentes afetivos
        em Brasília. Cada cesta é feita à mão, por encomenda, com cartão de
        mensagem personalizado — você escreve para quem vai receber, e a
        cesta chega com esse cuidado junto.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {benefits.map((benefit) => (
          <div key={benefit.title}>
            <p className="text-sm font-semibold text-foreground">
              {benefit.title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <WhatsappCta />
      </div>
    </div>
  );
}
