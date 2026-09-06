import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Faq } from "@/components/loja/faq";
import { WhatsappCta } from "@/components/loja/whatsapp-cta";
import { getContent } from "@/modules/content/service";
import { getTenantId } from "@/lib/tenant/context";

const FALLBACK_TITLE = "Perguntas frequentes";

/** Primeiros ~160 caracteres das perguntas, sem cortar palavra no meio. */
function metaDescription(questions: string[]): string | undefined {
  const full = questions.join(" ").replace(/\s+/g, " ").trim();
  if (!full) return undefined;
  if (full.length <= 160) return full;
  const cut = full.slice(0, 160);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export async function generateMetadata(): Promise<Metadata> {
  const faq = await getContent(await getTenantId(), "faq");
  return {
    title: faq.title?.trim() || FALLBACK_TITLE,
    description: metaDescription(faq.items.map((item) => item.question)),
  };
}

export default async function FaqPage() {
  const faq = await getContent(await getTenantId(), "faq");
  const title = faq.title?.trim() || FALLBACK_TITLE;

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
        <span className="text-foreground">{title}</span>
      </nav>

      <Faq />
      <WhatsappCta />
    </div>
  );
}
