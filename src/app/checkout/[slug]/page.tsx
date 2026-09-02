import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getProductForCheckout } from "@/modules/catalog/service";
import { getDeliverySettings, getDeliveryZones } from "@/modules/delivery/settings";
import { CheckoutForm } from "@/components/loja/checkout/checkout-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/checkout/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const found = await getProductForCheckout(slug);
  if (!found) return {};
  return { title: `Comprar ${found.product.name} | Juliana Present` };
}

export default async function CheckoutPage(props: PageProps<"/checkout/[slug]">) {
  const { slug } = await props.params;

  const [found, settings, zones] = await Promise.all([
    getProductForCheckout(slug),
    getDeliverySettings(),
    getDeliveryZones(),
  ]);

  if (!found || !settings) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/produto/${slug}`} className="transition-colors hover:text-primary">
          {found.product.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Comprar</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl text-foreground md:text-4xl">
        Finalizar {found.product.name}
      </h1>

      <div className="mt-8">
        <CheckoutForm
          product={found.product}
          addons={found.addons}
          zones={zones}
          cardMaxWords={settings.cardMaxWords}
        />
      </div>
    </div>
  );
}
