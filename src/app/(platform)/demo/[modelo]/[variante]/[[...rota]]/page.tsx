import { notFound } from "next/navigation";
import { getTema, getVariacao } from "@/storefront/temas";
import { dadosDemo } from "@/storefront/temas/dados-demo";
import { RotaLoja } from "@/storefront/temas/rota";

export const dynamic = "force-dynamic";

/** Loja de DEMONSTRAÇÃO navegável (cestas de exemplo). Ver `RotaLoja` para as páginas. */
export default async function DemoPagina(props: { params: Promise<{ modelo: string; variante: string; rota?: string[] }> }) {
  const { modelo, variante, rota = [] } = await props.params;
  const tema = getTema(modelo);
  if (!tema) notFound();
  const v = getVariacao(tema, variante);
  const d = await dadosDemo(v, `/demo/${tema.key}/${v.key}`);
  return <RotaLoja tema={tema.key} d={d} rota={rota} />;
}
