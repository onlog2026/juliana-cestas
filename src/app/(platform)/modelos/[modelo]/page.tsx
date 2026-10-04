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

  return (
    <>
      <LandingHeader branding={branding} />
      <main className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          <Link href="/modelos" className="hover:text-foreground">
            Modelos
          </Link>{" "}
          / {modelo.name}
        </p>
        <div className="mt-5 grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-14">
          <ModelStage modelo={modelo} />
          <section aria-labelledby="m-nome" className="pt-1">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">{modelo.plano}</p>
            <h1 id="m-nome" className="mt-2 font-display text-5xl text-foreground">
              {modelo.name}
            </h1>
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
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link
                href={`/cadastro?modelo=${modelo.key}`}
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground"
              >
                Criar loja com este modelo
              </Link>
              <a
                href={`/modelos/ver/${modelo.key}`}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-foreground px-5 font-semibold text-foreground"
              >
                Ver loja demo
              </a>
            </div>
            <dl className="mt-8 border-t border-border">
              {modelo.ficha.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-border py-3.5 text-sm">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-semibold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <h2 className="mt-20 font-display text-3xl text-foreground">Outros modelos</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {outros.map((m) => (
            <Link key={m.key} href={`/modelos/${m.key}`} className="rounded-2xl border border-border bg-card p-3 hover:shadow-lg">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.telas[0].desktop}
                  alt={`Modelo ${m.name}`}
                  className="absolute inset-0 size-full object-cover object-top"
                  loading="lazy"
                />
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
