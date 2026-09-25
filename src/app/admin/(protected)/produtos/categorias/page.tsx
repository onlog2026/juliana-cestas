import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireStaff } from "@/lib/auth/require-staff";
import { getAllCategoriesAdmin } from "@/modules/catalog/categories";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const dynamic = "force-dynamic";

/**
 * Categorias e subcategorias, dentro de Produtos (que é onde a lojista procura).
 * Criar aqui, vincular no cadastro de cada produto ("Categoria"), e o site
 * mostra no menu como categoria → subcategorias.
 */
export default async function AdminCategoriasPage() {
  const staff = await requireStaff();
  const categories = await getAllCategoriesAdmin(staff.tenantId);

  return (
    <div className="max-w-3xl">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin/produtos" className="hover:text-primary">
          Produtos
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Categorias</span>
      </nav>

      <h1 className="mt-2 font-display text-2xl text-foreground">Categorias e subcategorias</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Crie as categorias que quiser e, dentro de cada uma, as subcategorias. Cada categoria pode ter um ícone
        (imagem). Depois é só escolher a categoria na ficha de cada produto — o site mostra tudo no menu, como
        categoria com as subcategorias dentro.
      </p>

      <section className="mt-6 rounded-card border border-border bg-card p-5">
        <CategoriesManager categories={categories} />
      </section>
    </div>
  );
}
