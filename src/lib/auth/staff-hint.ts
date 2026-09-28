/**
 * Palpite BARATO, só no navegador, de que este visitante pode ser da equipe:
 * existe um cookie de login do Supabase (`sb-<projeto>-auth-token`, possivelmente
 * "picado" em `.0`, `.1`...). O @supabase/ssr grava esse cookie com
 * `httpOnly: false` (o navegador precisa lê-lo), então o `document.cookie` o vê.
 *
 * Serve SÓ para decidir se vale perguntar ao servidor (`checkStaffSession`).
 * Não decide nada de segurança: a trava de verdade continua nas actions
 * (`requireStaff`/módulo). Um cookie forjado só faria o navegador perguntar ao
 * servidor, que responde "não é da equipe" -- e nenhum botão de edição aparece.
 *
 * Sem cookie de login (a imensa maioria dos visitantes da loja), a home não faz
 * NENHUMA chamada ao servidor para isso.
 */
export function hasSupabaseAuthCookie(cookieString: string): boolean {
  return /(?:^|;\s*)sb-[^=;]+-auth-token(?:\.\d+)?=/.test(cookieString);
}
