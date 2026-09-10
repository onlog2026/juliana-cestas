import { MessageCircle } from "lucide-react";
import { getTenantId } from "@/lib/tenant/context";
import { getContent } from "@/modules/content/service";
import { getStoreWhatsapp } from "@/modules/settings/store-profile";

export async function WhatsappCta() {
  const tenantId = await getTenantId();
  // Número do CADASTRO DA LOJA (banco), não mais do env da Vercel.
  const [content, whatsapp] = await Promise.all([
    getContent(tenantId, "whatsapp_cta"),
    getStoreWhatsapp(tenantId),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-4 rounded-card bg-primary px-6 py-10 text-center text-primary-foreground sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-display text-2xl">{content.title}</p>
          <p className="mt-1 text-sm text-primary-foreground/85">
            {content.body}
          </p>
        </div>
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="jc-shine-cta inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[var(--jc-whatsapp)] px-6 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          <MessageCircle className="size-5" />
          {content.buttonLabel}
        </a>
      </div>
    </section>
  );
}
