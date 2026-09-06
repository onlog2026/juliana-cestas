import type { Metadata } from "next";
import Link from "next/link";
import { MailQuestion, PackageCheck } from "lucide-react";
import { getTenantId } from "@/lib/tenant/context";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { hashToken } from "@/modules/orders/token";
import { lookupInviteByHash } from "@/modules/reviews/service";
import { ReviewForm } from "@/components/loja/reviews/review-form";

export const metadata: Metadata = {
  title: "Avaliar minha compra",
  // Página pessoal de uma pessoa só: não é conteúdo de busca.
  robots: { index: false, follow: false },
};

/** `?nota=4` vindo das estrelas do e-mail. Só aceita 1..5; o resto vira null. */
function notaDaUrl(valor: string | undefined): number | null {
  if (!valor) return null;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

function Moldura({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">{children}</div>;
}

/**
 * Página do link do e-mail. Token inválido, expirado ou já usado NUNCA mostra
 * erro cru (404 branco, "Application error"): quem clica aqui é uma cliente
 * que acabou de receber uma cesta, e a última coisa que ela deve ver é uma
 * tela de defeito. Sempre uma explicação em português e um caminho de volta.
 */
export default async function AvaliarPage(props: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ nota?: string }>;
}) {
  const { token } = await props.params;
  const { nota } = await props.searchParams;

  const tenantId = await getTenantId();
  const storeName = (await getStoreProfile(tenantId)).businessName?.trim() || "";
  const convite = await lookupInviteByHash(tenantId, hashToken(token));

  if (convite.state === "ja_respondida") {
    return (
      <Moldura>
        <div className="rounded-card border border-border bg-card p-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
            <PackageCheck className="size-6 text-primary" />
          </span>
          <h1 className="mt-4 font-display text-2xl text-foreground">
            Essa avaliação já foi enviada
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Obrigado por ter respondido! Cada pedido pode ser avaliado uma vez só. Assim que a
            loja conferir, sua avaliação aparece no site.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Voltar para a loja
          </Link>
        </div>
      </Moldura>
    );
  }

  if (convite.state === "invalida") {
    return (
      <Moldura>
        <div className="rounded-card border border-border bg-card p-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
            <MailQuestion className="size-6 text-primary" />
          </span>
          <h1 className="mt-4 font-display text-2xl text-foreground">
            Não encontramos esse convite
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O endereço pode ter sido copiado pela metade, ou o convite já foi usado. Abra de novo
            o link direto do e-mail que você recebeu{storeName ? ` da ${storeName}` : ""} — ele é
            único e leva direto para a sua avaliação.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Voltar para a loja
          </Link>
        </div>
      </Moldura>
    );
  }

  return (
    <Moldura>
      <h1 className="font-display text-3xl text-foreground">Como foi sua compra?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {convite.orderNumber ? `Pedido #${convite.orderNumber}` : "Sua compra"}
        {convite.productName ? ` · ${convite.productName}` : ""}
        {storeName ? ` · ${storeName}` : ""}
      </p>

      <div className="mt-6">
        <ReviewForm
          token={token}
          notaInicial={notaDaUrl(nota)}
          customerName={convite.customerName}
        />
      </div>
    </Moldura>
  );
}
