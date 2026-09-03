"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteProduct } from "@/modules/catalog/actions";

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Remover "${productName}" do site? O histórico de pedidos continua intacto.`)) return;
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.ok) router.push("/admin/produtos");
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex h-10 items-center gap-2 rounded-full border border-destructive/30 px-5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      Remover cesta do site
    </button>
  );
}
