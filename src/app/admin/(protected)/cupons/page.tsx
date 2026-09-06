import { requireStaffWithModule } from "@/lib/auth/require-module";
import { getAllCouponsAdmin, getCouponRedemptionCounts } from "@/modules/coupons/service";
import { CouponsManager } from "@/components/admin/coupons-manager";

export default async function AdminCuponsPage() {
  // TRAVA DE SERVIDOR: esconder o item do menu não impede ninguém de
  // digitar este endereço na barra do navegador. Quem chega aqui sem o
  // módulo "cupons" no plano é levado para a página de oferta.
  // (Esta tela é a dos cupons de desconto.)
  const staff = await requireStaffWithModule("cupons");
  const [coupons, redemptionCounts] = await Promise.all([
    getAllCouponsAdmin(staff.tenantId),
    getCouponRedemptionCounts(staff.tenantId),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-foreground">Cupons</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cupons de desconto pro checkout. O desconto é sempre recalculado no servidor na hora da compra.
      </p>

      <div className="mt-6">
        <CouponsManager coupons={coupons} redemptionCounts={redemptionCounts} />
      </div>
    </div>
  );
}
