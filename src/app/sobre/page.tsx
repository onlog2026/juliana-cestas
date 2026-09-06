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
  const about = await getContent(await getTenantId(), "about");
  return {
    title: about.title,
    description: metaDescription(about.blocks),
  };
}

export default async function SobrePage() {
  const tenantId = await getTenantId();
  const [about, benefitsContent] = await Promise.all([
    getContent(tenantId, "about"),
    getContent(tenantId, "benefits"),
  ]);
  const [lead, ...rest] = about.blocks;

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
        <span className="text-foreground">{about.title}</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl text-foreground md:text-4xl">
        {about.title}
      </h1>
      {lead ? (
        <p className="mt-4 font-display text-xl leading-relaxed text-foreground">
          {lead.text}
        </p>
      ) : null}
      {rest.map((block, index) => (
        <div key={index} className="mt-4">
          {block.title ? (
            <p className="font-semibold text-foreground">{block.title}</p>
          ) : null}
          <p className="text-muted-foreground">{block.text}</p>
        </div>
      ))}

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {benefitsContent.items.map((benefit) => (
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
