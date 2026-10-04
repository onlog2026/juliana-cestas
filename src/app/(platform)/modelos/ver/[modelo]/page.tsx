import { redirect } from "next/navigation";
import { getTema, getVariacao } from "@/storefront/temas";

/** Endereço antigo da demo: agora é uma loja navegável em /demo/<modelo>/<variante>. */
export default async function VerAntigo(props: { params: Promise<{ modelo: string }>; searchParams: Promise<{ variante?: string }> }) {
  const { modelo } = await props.params;
  const { variante } = await props.searchParams;
  const tema = getTema(modelo);
  if (!tema) redirect("/modelos");
  redirect(`/demo/${tema.key}/${getVariacao(tema, variante).key}`);
}
