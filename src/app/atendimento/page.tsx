import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? "";

export const metadata: Metadata = {
  title: "Atendimento | Juliana Cestas",
  description: "Fale com a Juliana Cestas pelo WhatsApp para pedidos, dúvidas e acompanhamento.",
};

export default function AtendimentoPage() {
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
        <span className="text-foreground">Atendimento</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl text-foreground md:text-4xl">
        Atendimento
      </h1>
      <p className="mt-4 text-muted-foreground">
        Todo o atendimento da Juliana Cestas — pedido novo, dúvida sobre uma
        cesta, acompanhamento de entrega — é feito diretamente pelo WhatsApp.
      </p>

      <a
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noopener noreferrer"
        className="jc-shine-cta mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--jc-whatsapp)] px-7 text-base font-semibold text-white transition-transform active:scale-[0.98]"
      >
        <MessageCircle className="size-5" />
        Chamar no WhatsApp
      </a>

      <p className="mt-8 text-sm text-muted-foreground">
        Perguntas sobre pedido, pagamento e entrega já respondidas na{" "}
        <Link href="/faq" className="font-medium text-primary hover:underline">
          página de perguntas frequentes
        </Link>
        .
      </p>
    </div>
  );
}
