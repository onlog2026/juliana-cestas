import { requireStaffWithModule } from "@/lib/auth/require-module";
import { contarProdutosPorMarca, getAllBrandsAdmin } from "@/modules/brands/service";
import { BrandsManager } from "@/components/admin/brands-manager";

export default async function AdminMarcasPage() {
  // TRAVA DE SERVIDOR: esconder o item do menu não impede ninguém de digitar
  // este endereço na barra do navegador. Quem chega aqui sem o módulo "marcas"
  // no plano é levado para a página de oferta.
  const staff = await requireStaffWithModule("marcas");
  const [marcas, contagem] = await Promise.all([
    getAllBrandsAdmin(staff.tenantId),
    contarProdutosPorMarca(staff.tenantId),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-foreground">Marcas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        As marcas dos produtos que você vende. Excluir uma marca nunca apaga cesta nenhuma: as cestas apenas
        ficam sem marca.
      </p>

      <div className="mt-6">
        <BrandsManager brands={marcas} productCounts={contagem} />
      </div>
    </div>
  );
}
