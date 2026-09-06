"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/**
 * Entrar com Google, para a PLATAFORMA (criar/abrir a própria loja).
 *
 * É exatamente o mesmo mecanismo do login do cliente da loja
 * (`src/app/(store)/conta/entrar/page.tsx`): `signInWithOAuth` do Supabase Auth
 * e a rota `/auth/callback` que já existe. Não há um segundo sistema de login
 * na casa — dois jeitos de autenticar é como se acaba com um deles seguro e o
 * outro esquecido.
 *
 * A senha nunca passa por aqui em nenhum caminho: quem cuida disso é o Google
 * e o Supabase Auth.
 */
export function BotaoGoogle({ next, rotulo }: { next: string; rotulo: string }) {
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar() {
    setIndo(true);
    setErro(null);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      // Sem isto, o botão ficava girando para sempre quando o Google não abria.
      console.error("[cadastro] falha ao iniciar o login com Google:", error);
      setErro("Não consegui abrir o login do Google. Tente de novo ou use e-mail e senha.");
      setIndo(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={entrar}
        disabled={indo}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
      >
        {indo ? <Loader2 className="size-4 animate-spin" /> : <MarcaGoogle />}
        {rotulo}
      </button>
      {erro ? <p className="mt-2 text-sm text-destructive">{erro}</p> : null}
    </>
  );
}

function MarcaGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09A6.87 6.87 0 0 1 5.48 12c0-.73.13-1.43.36-2.09V7.07H2.18A10.93 10.93 0 0 0 1 12c0 1.77.42 3.44 1.18 4.93z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
