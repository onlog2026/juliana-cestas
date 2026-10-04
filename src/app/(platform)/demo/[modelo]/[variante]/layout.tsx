import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { TemaRoot, getTema } from "@/storefront/temas";
import { DemoCartProvider } from "@/storefront/temas/demo-cart";
import { TestarBar } from "@/storefront/temas/testar-bar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Loja de demonstração", robots: { index: false, follow: false } };

export default async function DemoLayout(props: { children: ReactNode; params: Promise<{ modelo: string; variante: string }> }) {
  const { modelo, variante } = await props.params;
  const tema = getTema(modelo);
  if (!tema) notFound();
  const v = tema.variacoes.find((x) => x.key === variante);
  if (!v) notFound();
  return (
    <TemaRoot tema={tema.key} v={v}>
      <DemoCartProvider chave={`${modelo}-${variante}`}>
        <TestarBar
          modelo={tema.key}
          nomeModelo={tema.name}
          variante={v.key}
          variacoes={tema.variacoes.map((x) => ({ key: x.key, nome: x.name, cor: x.paleta.primary }))}
        />
        <div style={{ paddingTop: 56 }}>{props.children}</div>
      </DemoCartProvider>
    </TemaRoot>
  );
}
