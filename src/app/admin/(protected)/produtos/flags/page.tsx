import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireStaffWithModule } from "@/lib/auth/require-module";
import { getContent } from "@/modules/content/service";
import { FlagsEditor } from "@/components/admin/flags-editor";

/**
 * Flags e tarjas de promoção. Fica DENTRO de Produtos (como "Categorias") e não é
 * um módulo novo. Salvar usa o mesmo caminho do CMS (`updateContent("flags")`),
 * por isso exige o módulo "cms".
 */
export default async function AdminFlagsPage() {
  const staff = await requireStaffWithModule("cms");
  const flags = await getContent(staff.tenantId, "flags");

  return (
    <div className="max-w-[1100px]">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin/produtos" className="hover:text-primary">
          Produtos
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Flags e tarjas</span>
      </nav>
      <h1 className="mt-2 font-display text-2xl text-foreground">Flags e tarjas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tarjas na diagonal na ponta da foto das cestas: Promoção, Black Friday, Dia das Mães e as que você criar.
      </p>
      <div className="mt-6">
        <FlagsEditor value={flags} />
      </div>
    </div>
  );
}
