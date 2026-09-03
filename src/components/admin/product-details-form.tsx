"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { updateProductDetails } from "@/modules/catalog/actions";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { DbProduct } from "@/modules/catalog/service";
import type { Category } from "@/modules/catalog/categories";

function centsToReais(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function reaisToCents(raw: string): number {
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

/** "" (campo vazio) vira null -- nem todo número opcional pode virar 0. */
function reaisToCentsOrNull(raw: string): number | null {
  if (!raw.trim()) return null;
  return reaisToCents(raw);
}

function intOrNull(raw: string): number | null {
  if (!raw.trim()) return null;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : null;
}

export function ProductDetailsForm({ product, categories }: { product: DbProduct; categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [serves, setServes] = useState(product.serves ?? "");
  const [size, setSize] = useState(product.size ?? "");
  const [price, setPrice] = useState(centsToReais(product.price_cents));
  const [itemsText, setItemsText] = useState(product.items.join("\n"));
  const [packaging, setPackaging] = useState(product.packaging ?? "");
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  const [badge, setBadge] = useState(product.badge ?? "");
  const [active, setActive] = useState(product.active);
  const [categoryId, setCategoryId] = useState(product.category_id ?? "");
  const [cost, setCost] = useState(product.cost_cents !== null ? centsToReais(product.cost_cents) : "");
  const [sku, setSku] = useState(product.sku ?? "");
  const [barcode, setBarcode] = useState(product.barcode ?? "");
  const [stockQuantity, setStockQuantity] = useState(
    product.stock_quantity !== null ? String(product.stock_quantity) : ""
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    product.low_stock_threshold !== null ? String(product.low_stock_threshold) : ""
  );
  const [ncm, setNcm] = useState(product.ncm ?? "");
  const [cest, setCest] = useState(product.cest ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const margin = useMemo(() => {
    const priceCents = reaisToCents(price);
    const costCents = reaisToCentsOrNull(cost);
    if (costCents === null || priceCents <= 0) return null;
    return ((priceCents - costCents) / priceCents) * 100;
  }, [price, cost]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProductDetails({
        id: product.id,
        name,
        slug,
        serves,
        size,
        priceCents: reaisToCents(price),
        items: itemsText
          .split("\n")
          .map((i) => i.trim())
          .filter(Boolean),
        packaging,
        imageUrl,
        badge,
        active,
        categoryId: categoryId || null,
        costCents: reaisToCentsOrNull(cost),
        sku,
        barcode,
        stockQuantity: intOrNull(stockQuantity),
        lowStockThreshold: intOrNull(lowStockThreshold),
        ncm,
        cest,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Nome da cesta</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Link (slug)</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Categoria</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Serve quantas pessoas</span>
          <input
            value={serves}
            onChange={(e) => setServes(e.target.value)}
            placeholder="Para 2 pessoas"
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Tamanho</span>
          <input
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Selo (opcional)</span>
          <input
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="Mais pedida"
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      <div className="grid gap-4 rounded-[10px] border border-border bg-secondary/30 p-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Preço de venda (R$)</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Custo (opcional)</span>
          <input
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-foreground">Margem</span>
          <p
            className={`flex h-11 items-center text-sm font-semibold ${
              margin === null ? "text-muted-foreground" : margin < 0 ? "text-destructive" : "text-primary"
            }`}
          >
            {margin === null ? "Informe o custo para calcular" : `${margin.toFixed(1)}%`}
          </p>
        </div>
      </div>

      <ImageUploadField label="Foto da cesta" value={imageUrl} onChange={setImageUrl} />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">O que vem na cesta (um item por linha)</span>
        <textarea
          value={itemsText}
          onChange={(e) => setItemsText(e.target.value)}
          rows={6}
          className="w-full resize-none rounded-[10px] border border-border bg-background px-3.5 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Embalagem (opcional)</span>
        <textarea
          value={packaging}
          onChange={(e) => setPackaging(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-[10px] border border-border bg-background px-3.5 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">SKU (opcional)</span>
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Código de barras (opcional)</span>
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Estoque (em branco = sob encomenda, sem limite)</span>
          <input
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            inputMode="numeric"
            placeholder="Ilimitado"
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Avisar quando o estoque chegar a</span>
          <input
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)}
            inputMode="numeric"
            placeholder="Ex: 3"
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      <details className="rounded-[10px] border border-border">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-foreground">
          Dados fiscais (opcional — pra quando emitir nota fiscal)
        </summary>
        <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">NCM</span>
            <input
              value={ncm}
              onChange={(e) => setNcm(e.target.value)}
              placeholder="0000.00.00"
              className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">CEST</span>
            <input
              value={cest}
              onChange={(e) => setCest(e.target.value)}
              placeholder="00.000.00"
              className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>
      </details>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4 rounded border-border"
        />
        Ativa (aparece no site)
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
        {saved ? "Salvo" : "Salvar"}
      </button>
    </form>
  );
}
