import Link from "next/link";
import { requireStaff } from "@/lib/auth/require-staff";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { getEntitlements } from "@/modules/entitlements/service";
import { ADMIN_MENU_MODULES, buildGroupedAdminMenu } from "@/lib/modules/registry";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { MobileNavDrawer } from "@/components/admin/mobile-nav-drawer";
import { PlanBanner } from "@/components/admin/plan-banner";

/**
 * O menu deste painel é montado A PARTIR DOS DIREITOS DE ACESSO da loja:
 * módulo que o plano não libera simplesmente NÃO APARECE (não fica cinza, não
 * fica com cadeado). Quem quiser conhecer o recurso chega nele pela página de
 * oferta, `/admin/oferta/<slug>`, que explica e vende.
 *
 * Duas travas de segurança, porque este arquivo é o painel de uma loja que está
 * no ar com clientes reais:
 *
 *  1. `getEntitlements()` NUNCA lança -- se a leitura falhar, ela devolve tudo
 *     liberado e marca `degradado`. O menu, portanto, aparece INTEIRO em caso de
 *     erro, nunca vazio.
 *  2. Ainda assim, se por qualquer motivo a lista filtrada vier vazia, este
 *     arquivo cai no menu completo. Painel sem menu é painel inutilizável, e
 *     entre mostrar demais e mostrar de menos aqui, mostrar demais é o erro
 *     barato.
 *
 * A loja da Juliana está no plano `fundadora`, que libera tudo e nunca bloqueia
 * -- ela não vê nenhuma diferença por causa deste arquivo.
 */

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  // O nome que aparece no painel é o da loja de quem está logado -- nunca um
  // nome fixo. Se a loja ainda não preencheu o cadastro, usa texto neutro.
  // As duas leituras em paralelo: o painel não deve ficar mais lento por causa
  // do menu novo.
  const [profile, entitlements] = await Promise.all([getStoreProfile(staff.tenantId), getEntitlements(staff)]);
  const storeName = profile.businessName?.trim() || "";

  const liberados = ADMIN_MENU_MODULES.filter((m) => entitlements.allowed.includes(m.slug));
  // Trava 2: nunca entregar um menu vazio.
  const visiveis = liberados.length > 0 ? liberados : ADMIN_MENU_MODULES;

  // Menu agrupado em departamentos (Vendas, Catálogo, ...). Departamento sem
  // nenhum módulo liberado some sozinho (regra dentro de buildGroupedAdminMenu).
  const menu = buildGroupedAdminMenu(visiveis);

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30 md:flex-row">
      {/* Barra do topo só no mobile -- o menu vira um drawer, do jeito que
          um app de verdade se comporta, em vez de espremer 8 itens numa
          linha horizontal. */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <Link href="/admin" className="font-display text-lg text-primary">
          {storeName || "Painel de gestão"}
        </Link>
        <MobileNavDrawer menu={menu} staffEmail={staff.email} storeName={storeName} />
      </div>

      <aside className="hidden shrink-0 md:flex md:w-56 md:flex-col md:border-r md:border-border md:bg-card md:px-4 md:py-6">
        <div>
          <Link href="/admin" className="font-display text-lg text-primary">
            {storeName || "Painel de gestão"}
          </Link>
          {storeName ? <p className="text-xs text-muted-foreground">Painel de gestão</p> : null}
        </div>

        <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
          <AdminNav menu={menu} />
        </div>

        <div className="mt-auto pt-8">
          <p className="truncate text-xs text-muted-foreground">{staff.email}</p>
          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {/* Em modo degradado (leitura falhou) não afirmamos nada sobre a
            assinatura: seria um aviso baseado em dado que não temos. */}
        {entitlements.degradado ? null : (
          <PlanBanner
            state={entitlements.state}
            diasRestantes={entitlements.diasDeTesteRestantes}
            planName={entitlements.planName}
          />
        )}
        {children}
      </main>
    </div>
  );
}
