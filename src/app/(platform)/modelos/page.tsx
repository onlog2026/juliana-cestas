import type { Metadata } from "next";
import Link from "next/link";
import { LandingHeader } from "@/components/platform/landing/header";
import { PLATFORM_DEFAULTS } from "@/modules/platform/landing-content";
import { getAllPlatformContent } from "@/modules/platform/landing-service";
import { MODELOS } from "@/modules/platform/modelos-catalog";

export const dynamic = "force-dynamic";
// Enquanto a plataforma não tem domínio próprio, estas páginas ficam fora do Google.
export const metadata: Metadata = { title: "Modelos de loja", robots: { index: false, follow: false } };

export default async function ModelosPage() {
  let branding = PLATFORM_DEFAULTS.branding;
  try {
    branding = (await getAllPlatformContent()).branding;
  } catch {
    /* usa o padrão */
  }
  return (
    <>
      <LandingHeader branding={branding} />
      <main className="mx-auto max-w-[2000px] px-4 pt-12 pb-24 sm:px-6 lg:px-10 2xl:px-14">
        <h1 className="font-display text-4xl text-foreground sm:text-5xl">Modelos de loja para cestas</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Escolha o visual da sua loja. Troque quando quiser, sem perder cestas nem pedidos.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {MODELOS.map((m) => (
            <Link
              key={m.key}
              href={`/modelos/${m.key}`}
              className="group block rounded-2xl border border-border bg-card p-3 transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.telas[0].desktop}
                  alt={`Modelo ${m.name} no computador`}
                  className="absolute inset-0 size-full object-cover object-top"
                  loading="lazy"
                />
              </div>
              <div className="px-2 pt-4 pb-2">
                <h2 className="font-display text-2xl text-foreground">{m.name}</h2>
                <p className="mt-1 text-sm font-medium text-primary">{m.plano}</p>
                <p className="mt-2 text-sm text-muted-foreground">{m.paraQuem}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
