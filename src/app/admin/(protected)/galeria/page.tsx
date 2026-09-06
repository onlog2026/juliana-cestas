import { requireStaffWithModule } from "@/lib/auth/require-module";
import { listMediaLibrary } from "@/modules/media/library";
import { MediaLibrary } from "@/components/admin/media-library";

export default async function AdminGaleriaPage() {
  // TRAVA DE SERVIDOR: esconder o item do menu não impede ninguém de digitar
  // este endereço na barra do navegador. Quem chega aqui sem o módulo "galeria"
  // no plano é levado para a página de oferta.
  const staff = await requireStaffWithModule("galeria");
  const itens = await listMediaLibrary(staff.tenantId);

  return (
    <div className="max-w-[1400px]">
      <h1 className="font-display text-2xl text-foreground">Galeria</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        As fotos e vídeos da loja num lugar só. Envie uma vez e reaproveite em produtos, banners e marcas
        copiando o endereço da imagem.
      </p>

      <div className="mt-6">
        <MediaLibrary items={itens} />
      </div>
    </div>
  );
}
