import "server-only";
import { redirect } from "next/navigation";
import { requireStaff, getStaffUser, type StaffUser } from "@/lib/auth/require-staff";
import { getEntitlements, moduloLiberado } from "@/modules/entitlements/service";

/**
 * A TRAVA DE SERVIDOR do direito de acesso por plano.
 *
 * Esconder o item do menu NÃO é trava: quem sabe o endereço digita
 * `/admin/cupons` na barra e entra. No Agentop isso aconteceu de verdade --
 * "gate só no front": o usuário de uma empresa inadimplente chamava a rota
 * direto e passava. Por isso toda tela e toda ação de módulo não-núcleo tem que
 * passar por aqui, no servidor.
 *
 * São duas funções porque os dois lugares precisam de comportamentos
 * diferentes:
 *
 *   - **página** -> redireciona para a oferta (`/admin/oferta/<slug>`), que
 *     explica o que o módulo faz e como contratar. Página que devolve erro seco
 *     é uma porta fechada sem placa.
 *   - **server action** -> devolve `{ ok: false, error: "modulo_nao_contratado" }`.
 *     Action NUNCA redireciona: o formulário do lado do cliente precisa receber
 *     a resposta e mostrar a mensagem.
 *
 * NADA foi instrumentado ainda -- este arquivo entrega a função pronta. Os
 * lugares que devem passar a usá-la estão listados no fim deste comentário.
 *
 * Como usar numa PÁGINA:
 * ```ts
 * export default async function AdminCuponsPage() {
 *   const staff = await requireStaffWithModule("cupons"); // troca requireStaff()
 *   ...
 * }
 * ```
 *
 * Como usar numa SERVER ACTION:
 * ```ts
 * "use server";
 * export async function salvarCupom(input: X) {
 *   const gate = await ensureModuleForAction("cupons");
 *   if (!gate.ok) return gate;               // { ok: false, error: "..." }
 *   const staff = gate.staff;
 *   ...
 * }
 * ```
 *
 * Onde isto DEVERIA ser aplicado depois (módulos que não são do núcleo e já têm
 * tela): `entregas`, `atendimento`, `cupons`, `cms`, `seo`.
 */

/** O que uma action devolve quando o módulo não está contratado. */
export type ModuleGateDenied = {
  ok: false;
  error: "modulo_nao_contratado" | "nao_autenticado";
  /** Frase pronta em português para a tela mostrar. */
  mensagem: string;
};

export type ModuleGateResult = { ok: true; staff: StaffUser } | ModuleGateDenied;

/**
 * Página: garante que quem está vendo é staff DESTA loja **e** que a loja tem o
 * módulo. Sem sessão -> vai para o login (comportamento de `requireStaff`).
 * Sem o módulo -> vai para a página de oferta.
 */
export async function requireStaffWithModule(slug: string): Promise<StaffUser> {
  const staff = await requireStaff();
  const ent = await getEntitlements(staff); // nunca lança; no pior caso libera tudo
  if (!moduloLiberado(ent, slug)) {
    redirect(`/admin/oferta/${encodeURIComponent(slug)}`);
  }
  return staff;
}

/**
 * Server action: devolve o resultado em vez de redirecionar.
 *
 * Nunca lança e nunca navega -- quem chama decide o que mostrar.
 */
export async function ensureModuleForAction(slug: string): Promise<ModuleGateResult> {
  const staff = await getStaffUser();
  if (!staff) {
    return {
      ok: false,
      error: "nao_autenticado",
      mensagem: "Sua sessão expirou. Entre de novo no painel para continuar.",
    };
  }

  const ent = await getEntitlements(staff);
  if (!moduloLiberado(ent, slug)) {
    return {
      ok: false,
      error: "modulo_nao_contratado",
      mensagem: "Este recurso não faz parte do seu plano atual. Abra a página do recurso para ver como contratar.",
    };
  }

  return { ok: true, staff };
}
