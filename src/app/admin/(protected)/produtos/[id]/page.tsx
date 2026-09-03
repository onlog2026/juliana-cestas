import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getAllProductsAdmin, getUpsellProductIds } from "@/modules/catalog/service";
import { ProductDetailsForm } from "@/components/admin/product-details-form";
import { ProductDeliveryForm } from "@/components/admin/product-delivery-form";
import { ProductUpsellsForm } from "@/components/admin/product-upsells-form";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

export default async function AdminProdutoPage(props: PageProps<"/admin/produtos/[id]">) {
  const { id } = await props.params;
  const products = await getAllProductsAdmin();
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  const upsellIds = await getUpsellProductIds(product.id);
  const otherProducts = products.filter((p) => p.id !== product.id);

  return (
    <div className="max-w-2xl">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin/produtos" className="hover:text-primary">
          Produtos
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <h1 className="mt-2 font-display text-2xl text-foreground">{product.name}</h1>

      <section className="mt-6 rounded-card border border-border bg-card p-5">
        <h2 className="font-display text-lg text-foreground">Dados da cesta</h2>
        <div className="mt-4">
          <ProductDetailsForm product={product} />
        </div>
      </section>

      <section className="mt-6 rounded-card border border-border bg-card p-5">
        <h2 className="font-display text-lg text-foreground">Valor de entrega</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Retirada na loja é sempre grátis. Para entrega, este valor é somado à taxa da região escolhida pelo cliente.
        </p>
        <div className="mt-4">
          <ProductDeliveryForm productId={product.id} deliveryFeeCents={product.delivery_fee_cents} />
        </div>
      </section>

      <section className="mt-6 rounded-card border border-border bg-card p-5">
        <h2 className="font-display text-lg text-foreground">Produtos sugeridos (upsell)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Marcados aqui, aparecem como sugestão de compra extra na página de pagamento de {product.name}.
        </p>
        <div className="mt-4">
          <ProductUpsellsForm
            productId={product.id}
            otherProducts={otherProducts.map((p) => ({ id: p.id, name: p.name, price_cents: p.price_cents }))}
            selectedIds={upsellIds}
          />
        </div>
      </section>

      <div className="mt-6">
        <DeleteProductButton productId={product.id} productName={product.name} />
      </div>
    </div>
  );
}
