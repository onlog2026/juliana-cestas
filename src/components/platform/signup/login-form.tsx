"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { BotaoGoogle } from "@/components/platform/signup/google-button";

/**
 * Entrar na plataforma (a pessoa que TEM ou vai ter uma loja).
 *
 * Mesmo mecanismo do login do cliente da loja: `signInWithPassword` /
 * `signInWithOAuth` do Supabase Auth. **Nada aqui gera, guarda, compara ou
 * transporta senha** — a senha vai do campo direto para o Supabase Auth pelo
 * SDK oficial, e a recuperação é o fluxo de e-mail dele.
 *
 * Depois de entrar, a decisão de PARA ONDE ir não é tomada aqui: a página
 * `/entrar` (servidor) é que sabe se a pessoa já tem loja. Por isso o sucesso
 * faz uma navegação de página inteira para `/entrar` — o servidor então manda
 * para o painel da loja dela ou para `/cadastro`. Decidir no navegador exigiria
 * expor no cliente quem tem loja e qual é.
 */
export function PlatformLoginForm() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    setAviso(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setErro("E-mail ou senha incorretos.");
      setCarregando(false);
      return;
    }

    // Navegação de página inteira de propósito: o destino pode ser outro
    // domínio (o endereço da loja da pessoa), e quem decide isso é o servidor.
    window.location.assign("/entrar");
  }

  async function esqueciASenha() {
    if (!email) {
      setErro("Digite seu e-mail no campo acima primeiro.");
      return;
    }
    setErro(null);
    setAviso(null);
    const supabase = createBrowserSupabaseClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    // Resposta igual existindo ou não a conta: dizer "esse e-mail não tem
    // conta" transforma o formulário num verificador de e-mails cadastrados.
    // MAS isso só vale para a ausência de erro -- `resetPasswordForEmail`
    // nunca devolve erro por "e-mail não cadastrado", então um erro aqui é
    // sempre um problema real de envio (ex.: limite de e-mail do Supabase
    // excedido, que já aconteceu de verdade nesta conta). Fingir sucesso
    // nesse caso engana quem clicou.
    if (resetError) {
      setErro("Não conseguimos enviar o e-mail agora. Tente de novo em alguns minutos.");
      return;
    }
    setAviso("Se esse e-mail tiver conta, enviamos um link para você criar uma senha nova.");
  }

  return (
    <div className="w-full max-w-sm rounded-card border border-border bg-card p-6 shadow-[var(--jc-shadow)] sm:p-8">
      <h1 className="font-display text-2xl text-foreground">Entrar</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Entre para abrir o painel da sua loja. Se você ainda não tem loja, criamos uma em seguida.
      </p>

      <div className="mt-6">
        <BotaoGoogle next="/entrar" rotulo="Entrar com Google" />
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={entrar} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">E-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-[10px] border border-border bg-background px-3.5 text-base text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Senha</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="h-12 w-full rounded-[10px] border border-border bg-background px-3.5 text-base text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:text-sm"
          />
        </label>

        {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
        {aviso ? <p className="text-sm text-primary">{aviso}</p> : null}

        <button
          type="submit"
          disabled={carregando}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {carregando ? <Loader2 className="size-4 animate-spin" /> : null}
          Entrar
        </button>
      </form>

      <button
        type="button"
        onClick={esqueciASenha}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center text-sm text-muted-foreground hover:text-primary"
      >
        Esqueci minha senha
      </button>

      <p className="mt-2 border-t border-border pt-4 text-center text-sm text-muted-foreground">
        Ainda não tem loja?{" "}
        <Link href="/cadastro" className="font-semibold text-primary hover:underline">
          Criar a minha agora
        </Link>
      </p>
    </div>
  );
}
