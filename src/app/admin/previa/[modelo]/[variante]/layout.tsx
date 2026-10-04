import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireStaffWithModule } from "@/lib/auth/require-module";
import { getEntitlements } from "@/modules/entitlements/service";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { TemaRoot, getTema } from "@/storefront/temas";
import { DemoCartProvider } from "@/storefront/temas/demo-cart";
import { getTemaInstalado, planoPermite } from "@/storefront/temas/instalado";
import { PreviaBar } from "@/storefront/temas/previa-bar";
import { dadosLoja } from "@/storefront/temas/dados-loja";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prévia do modelo", robots: { index: false, follow: false } };

/**
 * PRÉVIA do modelo com os produtos REAIS do lojista (só quem está logado, só a
 * loja da sessão). Nada muda na loja até clicar em "Instalar este modelo".
 */
export default async function PreviaLayout(props: { children: ReactNode; params: Promise<{ modelo: string; variante: string }> }) {
  const staff = await requireStaffWithModule("templates");
  const { modelo, variante } = await props.params;
  const tema = getTema(modelo);
  if (!tema) notFound();
  const v = tema.variacoes.find((x) => x.key === variante);
  if (!v) notFound();

  const [ent, instalado, d] = await Promise.all([
    getEntitlements(staff),
    getTemaInstalado(staff.tenantId),
    dadosLoja(staff.tenantId, `/admin/previa/${tema.key}/${v.key}`, v),
  ]);
  const bloqueado = !staff.isSuperAdmin && ent.state !== "teste" && !planoPermite(ent.planSlug, tema.plano);

  return (
    <TemaRoot tema={tema.key} v={v}>
      <ConfirmProvider>
        <DemoCartProvider chave={`previa-${tema.key}-${v.key}`}>
          <PreviaBar
            modelo={tema.key}
            nomeModelo={tema.name}
            variante={v.key}
            variacoes={tema.variacoes.map((x) => ({ key: x.key, nome: x.name, cor: x.paleta.primary }))}
            instaladoAgora={instalado?.tema.key === tema.key && instalado.variacao.key === v.key}
            temAnterior={Boolean(instalado)}
            bloqueado={bloqueado}
            exemplo={d.exemplo}
          />
          <div style={{ paddingTop: d.exemplo ? 96 : 56 }}>{props.children}</div>
        </DemoCartProvider>
      </ConfirmProvider>
    </TemaRoot>
  );
}
