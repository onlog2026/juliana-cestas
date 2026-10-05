import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { LandingHeader } from "@/components/platform/landing/header";
import { ModelStage } from "@/components/platform/modelos/model-stage";
import { PLATFORM_DEFAULTS } from "@/modules/platform/landing-content";
import { getAllPlatformContent } from "@/modules/platform/landing-service";
import { MODELOS, getModelo } from "@/modules/platform/modelos-catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Modelo de loja", robots: { index: false, follow: false } };

export default async function ModeloPage(props: { params: Promise<{ modelo: string }> }) {
  const { modelo: key } = await props.params;
  const modelo = getModelo(key);
  if (!modelo) notFound();

  let branding = PLATFORM_DEFAULTS.branding;
  try {
    branding = (await getAllPlatformContent()).branding;
  } catch {
    /* usa o padrão */
  }
  const outros = MODELOS.filter((m) => m.key !== modelo.key);

  const ficha = (
    <>
      <p className="text-xs font-semibold tracking-widest text-primary uppercase">{modelo.plano}</p>
      <h1 className="mt-2 font-display text-5xl text-foreground">{modelo.name}</h1>
      <p className="mt-2 text-muted-foreground">Teste 7 dias grátis. Troque de modelo quando quiser.</p>
      <p className="mt-5 text-lg text-muted-foreground">{modelo.resumo}</p>
      <ul className="mt-5 grid gap-2.5">
        {modelo.destaques.map((d) => (
          <li key={d} className="flex gap-2.5 text-foreground">
            <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
            {d}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-muted-foreground">Indicado para: {modelo.paraQuem}</p>
    </>
  );

  return (
    <>
      <LandingHeader branding={branding} />
      <main className="mx-auto max-w-[2000px] px-4 pt-8 pb-32 sm:px-6 lg:px-10 lg:pb-24 2xl:px-14">
        <p className="mb-5 text-sm text-muted-foreground">
          <Link href="/modelos" className="hover:text-foreground">Modelos</Link> / {modelo.name}
        </p>
        <ModelStage modelo={modelo} ficha={ficha} />

        <h2 className="mt-20 font-display text-3xl text-foreground">Outros modelos</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {outros.map((m) => (
            <Link key={m.key} href={`/modelos/${m.key}`} className="rounded-2xl border border-border bg-card p-3 hover:shadow-lg">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.telas[0].desktop} alt={`Modelo ${m.name}`} className="absolute inset-0 size-full object-cover object-top" loading="lazy" />
              </div>
              <p className="mt-3 px-2 font-display text-xl text-foreground">{m.name}</p>
              <p className="px-2 pb-2 text-sm text-muted-foreground">{m.paraQuem}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
