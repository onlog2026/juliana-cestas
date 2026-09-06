import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { WhatsappCta } from "@/components/loja/whatsapp-cta";
import { getContent } from "@/modules/content/service";
import { getTenantId } from "@/lib/tenant/context";

/** Primeiros ~160 caracteres do texto, sem cortar palavra no meio. */
function metaDescription(blocks: { title?: string; text: string }[]): string | undefined {
  const full = blocks
    .map((b) => b.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!full) return undefined;
  if (full.length <= 160) return full;
  const cut = full.slice(0, 160);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export async function generateMetadata(): Promise<Metadata> {
  const returns = await getContent(await getTenantId(), "returns");
  return {
    title: returns.title,
    description: metaDescription(returns.blocks),
  };
}

export default async function TrocasEDevolucoesPage() {
  const returns = await getContent(await getTenantId(), "returns");
  const [lead, ...rest] = returns.blocks;

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
        <span className="text-foreground">{returns.title}</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl text-foreground md:text-4xl">
        {returns.title}
      </h1>
      {lead ? <p className="mt-4 text-muted-foreground">{lead.text}</p> : null}

      {rest.length > 0 ? (
        <div className="mt-6 space-y-6">
          {rest.map((block, index) => (
            <div key={index}>
              {block.title ? (
                <p className="font-semibold text-foreground">{block.title}</p>
              ) : null}
              <p className="text-sm text-muted-foreground">{block.text}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        <WhatsappCta />
      </div>
    </div>
  );
}
