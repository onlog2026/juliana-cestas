import Link from "next/link";
import { Headset, Package } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCustomerOrders } from "@/modules/customers/service";
import { getTenantId } from "@/lib/tenant/context";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { StatusBadge } from "@/components/admin/status-badge";
import { LogoutButton } from "@/components/conta/logout-button";
import { formatCents } from "@/lib/money";
import type { DadosLoja, TemaKey } from "../types";

/**
 * "Meus pedidos" AO VIVO com a cara do modelo (mesmos dados de `(store)/conta/page.tsx`).
 * Fica dentro do `TemaRoot` da loja: título na fonte do modelo, cartões com borda `--t-line`.
 * Quem não está logado é mandado ao login pelo `proxy.ts` (aqui devolve vazio, como a página original).
 */
export async function ContaAoVivo({ tema, d }: { tema: TemaKey; d: DadosLoja }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const tenantId = await getTenantId();
  const [pedidos, perfil] = await Promise.all([getCustomerOrders(tenantId, user.id, user.email ?? null), getStoreProfile(tenantId)]);
  const nome = (user.user_metadata?.name as string | undefined) || user.email || "";
  const loja = perfil.businessName?.trim() || d.loja;
  const cartao = "flex min-h-14 items-center justify-between gap-3 rounded-lg border p-4";

  return (
    <main data-recurso="conta" data-pagina-modelo={tema} className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-2xl" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)" }}>{loja}</p>
          <h1 className="mt-1 text-lg font-semibold" style={{ color: "var(--t-fg)" }}>Olá, {nome}</h1>
        </div>
        <LogoutButton />
      </div>

      <Link href={`${d.base}/conta/atendimento`} className={`${cartao} mt-6`} style={{ borderColor: "var(--t-line)", background: "var(--t-surface)", color: "var(--t-fg)" }}>
        <span className="flex items-center gap-2 text-sm font-medium"><Headset className="size-4" aria-hidden="true" /> Atendimento</span>
        <span className="text-xs" style={{ color: "var(--t-muted)" }}>Ver chamados</span>
      </Link>

      <h2 className="mt-8 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--t-fg)" }}>
        <Package className="size-4" aria-hidden="true" /> Meus pedidos
      </h2>

      {pedidos.length === 0 ? (
        <p className="mt-4 text-sm" style={{ color: "var(--t-muted)" }}>
          Você ainda não tem pedidos com este e-mail.{" "}
          <Link href={d.base || "/"} className="inline-flex min-h-11 items-center underline" style={{ color: "var(--t-primary)" }}>Ver as cestas</Link>
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {pedidos.map((o) => (
            <Link key={o.id} href={`${d.base}/conta/pedidos/${o.id}`} className={cartao} style={{ borderColor: "var(--t-line)", background: "var(--t-surface)", color: "var(--t-fg)" }}>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Pedido #{o.number} — {o.recipient_name}</p>
                <p className="text-xs" style={{ color: "var(--t-muted)" }}>
                  {o.delivery_date.split("-").reverse().join("/")} às {o.delivery_slot_start.slice(0, 5)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-medium">{formatCents(o.total_cents)}</span>
                <StatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
