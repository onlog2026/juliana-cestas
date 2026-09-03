import { getAllCouponsAdmin, getCouponRedemptionCounts } from "@/modules/coupons/service";
import { CouponsManager } from "@/components/admin/coupons-manager";

export default async function AdminCuponsPage() {
  const [coupons, redemptionCounts] = await Promise.all([
    getAllCouponsAdmin(),
    getCouponRedemptionCounts(),
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
