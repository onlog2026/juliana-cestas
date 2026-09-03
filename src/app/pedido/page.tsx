import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? "";

export const metadata: Metadata = {
  title: "Meu pedido",
  description: "Como acompanhar o seu pedido na Juliana Cestas.",
};

export default function PedidoPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Meu pedido</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl text-foreground md:text-4xl">
        Meu pedido
      </h1>
      <p className="mt-4 text-muted-foreground">
        Hoje os pedidos são combinados diretamente pelo WhatsApp — assim que
        você encomenda, a Juliana Cestas confirma tudo por lá: cesta,
        cartão, entrega e pagamento. É por essa mesma conversa que você
        acompanha o andamento do seu pedido.
      </p>

      <a
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noopener noreferrer"
        className="jc-shine-cta mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--jc-whatsapp)] px-7 text-base font-semibold text-white transition-transform active:scale-[0.98]"
      >
        <MessageCircle className="size-5" />
        Falar sobre meu pedido no WhatsApp
      </a>
    </div>
  );
}
