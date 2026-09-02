import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Faq } from "@/components/loja/faq";
import { WhatsappCta } from "@/components/loja/whatsapp-cta";

export const metadata: Metadata = {
  title: "Perguntas frequentes | Juliana Present",
  description:
    "Como fazer seu pedido, formas de pagamento e como funcionam as entregas das cestas Juliana Present.",
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Perguntas frequentes</span>
      </nav>

      <Faq />
      <WhatsappCta />
    </div>
  );
}
