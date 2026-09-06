/**
 * FONTE ÚNICA de super admin da plataforma no código TypeScript.
 *
 * O super admin é o dono da plataforma (não o dono de uma loja). Ele vê tudo,
 * em qualquer loja, por design -- e nenhum seller acessa o painel dele.
 *
 * Esta lista TEM QUE bater com a função SQL `public.is_super_admin()`
 * (migration 0019). O teste `tests/unit/registry.test.ts` lê o .sql e falha se
 * as duas divergirem -- foi exatamente essa divergência que, no Agentop, deixou
 * um e-mail "super admin pela API e cego pela UI/RLS".
 */
export const SUPER_ADMIN_EMAILS: readonly string[] = [
  "adrianorosa2012@gmail.com",
  "adrianorosa1@hotmail.com",
];

const SUPER_ADMINS = new Set(SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase()));

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMINS.has(email.trim().toLowerCase());
}
