import { notFound } from "next/navigation";
import { requireStaffWithModule } from "@/lib/auth/require-module";
import { getTema, getVariacao } from "@/storefront/temas";
import { dadosLoja } from "@/storefront/temas/dados-loja";
import { RotaLoja } from "@/storefront/temas/rota";

export const dynamic = "force-dynamic";

/** Prévia navegável com os produtos do lojista (somente leitura). */
export default async function PreviaPagina(props: { params: Promise<{ modelo: string; variante: string; rota?: string[] }> }) {
  const staff = await requireStaffWithModule("templates");
  const { modelo, variante, rota = [] } = await props.params;
  const tema = getTema(modelo);
  if (!tema) notFound();
  const v = getVariacao(tema, variante);
  const d = await dadosLoja(staff.tenantId, `/admin/previa/${tema.key}/${v.key}`, v);
  return <RotaLoja tema={tema.key} d={d} rota={rota} />;
}
