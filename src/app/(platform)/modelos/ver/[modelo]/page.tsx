import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HOMES, TemaRoot, getTema, getVariacao } from "@/storefront/temas";
import { dadosDemo } from "@/storefront/temas/dados-demo";

/**
 * Loja de DEMONSTRAÇÃO de um modelo + variação (`?variante=`). Não mexe em
 * nenhuma loja: usa nome fictício e fotos de cestas de exemplo. É daqui que
 * saem as capturas da vitrine e o botão "Ver loja demo". Fora do Google.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Loja demo", robots: { index: false, follow: false } };

export default async function LojaDemo(props: {
  params: Promise<{ modelo: string }>;
  searchParams: Promise<{ variante?: string }>;
}) {
  const { modelo } = await props.params;
  const { variante } = await props.searchParams;
  const tema = getTema(modelo);
  if (!tema) notFound();
  const v = getVariacao(tema, variante);
  const d = await dadosDemo(v);
  const Home = HOMES[tema.key];
  return (
    <TemaRoot tema={tema.key} v={v}>
      <Home d={d} />
    </TemaRoot>
  );
}
