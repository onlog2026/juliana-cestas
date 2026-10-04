import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Search, ShoppingBag, User } from "lucide-react";
import { SectionsRenderer } from "@/storefront/renderer";
import { TEMPLATES } from "@/storefront/templates";
import { themeToCss } from "@/storefront/theme";
import { LEGACY_TENANT_ID } from "@/lib/tenant/legacy";
import type { TemplateDefinition } from "@/storefront/templates/types";

/**
 * Loja de DEMONSTRAÇÃO de cada modelo: monta a home do modelo com as seções reais
 * e as fotos de cestas de exemplo, sem mexer em nenhuma loja. É daqui que saem as
 * capturas e o "Ver loja demo" da vitrine de modelos. Fora do Google (noindex).
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Loja demo", robots: { index: false, follow: false } };

const MENU = ["Cestas", "Ocasiões", "Kits", "Contato"];

// Fotos de cestas de exemplo para preencher os espaços de imagem que o modelo deixa vazios
// (a loja de verdade coloca as fotos dela).
const BASE = "https://oygizajevizwhiymgsly.supabase.co/storage/v1/object/public/site-media/a0000000-0000-4000-8000-000000000001/";
const FOTOS_DEMO = [
  BASE + "9a8ac246-f40e-43a8-a990-c18ed63a2807.webp",
  BASE + "cd4f6011-561f-4192-b990-a00ef27f9839.webp",
  BASE + "574704de-2564-4462-9949-14ce73a31af2.webp",
];

/** Percorre as props e troca `imageUrl` vazio por uma foto de exemplo (sem mexer no modelo original). */
function comFotos<T>(valor: T, cont = { n: 0 }): T {
  if (Array.isArray(valor)) return valor.map((v) => comFotos(v, cont)) as unknown as T;
  if (valor && typeof valor === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      out[k] = k === "imageUrl" && v === "" ? FOTOS_DEMO[cont.n++ % FOTOS_DEMO.length] : comFotos(v, cont);
    }
    return out as T;
  }
  return valor;
}

function DemoHeader({ t }: { t: TemplateDefinition }) {
  const v = t.layout.header.variant;
  const icons = (
    <div className="flex items-center gap-4 text-foreground">
      <User className="size-5" aria-hidden="true" />
      <ShoppingBag className="size-5" aria-hidden="true" />
    </div>
  );
  if (v === "centered") {
    return (
      <header className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-3">
          <p className="font-display text-3xl text-foreground">Sua Loja de Cestas</p>
          <nav className="flex gap-7 text-sm text-muted-foreground" aria-label="Demo">
            {MENU.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </nav>
        </div>
      </header>
    );
  }
  if (v === "search-first") {
    return (
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] items-center gap-6">
          <p className="font-display text-2xl whitespace-nowrap text-primary">Sua Loja de Cestas</p>
          <div className="flex h-11 flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground">
            <Search className="size-4" aria-hidden="true" /> Buscar cestas, ocasiões…
          </div>
          {icons}
        </div>
      </header>
    );
  }
  return (
    <header className="border-b border-border bg-background px-6 py-4">
      <div className="mx-auto flex max-w-[1200px] items-center gap-8">
        <p className="font-display text-2xl whitespace-nowrap text-primary">Sua Loja de Cestas</p>
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex" aria-label="Demo">
          {MENU.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </nav>
        <div className="ml-auto">{icons}</div>
      </div>
    </header>
  );
}

function DemoFooter({ t }: { t: TemplateDefinition }) {
  const compact = t.layout.footer.variant === "compact";
  return (
    <footer className="mt-12 border-t border-border bg-secondary/60 px-6 py-10 text-sm text-muted-foreground">
      <div className={`mx-auto max-w-[1200px] ${compact ? "flex flex-wrap justify-between gap-3" : "grid gap-8 md:grid-cols-3"}`}>
        <p className="font-display text-lg text-foreground">Sua Loja de Cestas</p>
        {!compact ? (
          <>
            <p>Atendimento de segunda a sábado.<br />WhatsApp e e-mail da sua loja.</p>
            <p>Pagamento por PIX e cartão.<br />Entrega com data e horário.</p>
          </>
        ) : (
          <p>© Sua Loja de Cestas · Feito com Cestas Store</p>
        )}
      </div>
    </footer>
  );
}

export default async function LojaDemo(props: { params: Promise<{ modelo: string }> }) {
  const { modelo } = await props.params;
  const t = TEMPLATES.find((x) => x.key === modelo);
  if (!t) notFound();
  const home = t.pages["/"];
  const css = themeToCss(t.theme, t.fonts, { selector: "[data-loja-demo]" });

  return (
    <div data-loja-demo className="min-h-screen bg-background text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
      {css ? <style>{css}</style> : null}
      <DemoHeader t={t} />
      <main>
        <SectionsRenderer sections={comFotos(home.sections)} tenantId={LEGACY_TENANT_ID} />
      </main>
      <DemoFooter t={t} />
    </div>
  );
}
