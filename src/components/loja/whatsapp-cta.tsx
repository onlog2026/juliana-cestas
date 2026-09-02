import { MessageCircle } from "lucide-react";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? "";

export function WhatsappCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-4 rounded-card bg-primary px-6 py-10 text-center text-primary-foreground sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-display text-2xl">Prefere combinar por WhatsApp?</p>
          <p className="mt-1 text-sm text-primary-foreground/85">
            A gente monta a cesta ideal com você, direto na conversa.
          </p>
        </div>
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[var(--jc-whatsapp)] px-6 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          <MessageCircle className="size-5" />
          Chamar no WhatsApp
        </a>
      </div>
    </section>
  );
}
