"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { addPlatformAdmin, setPlatformAdminActive } from "@/modules/platform/team-actions";

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primaryButton =
  "flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60";
const neutralButton =
  "flex h-9 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60";
const dangerButton =
  "flex h-9 items-center justify-center gap-2 rounded-full border border-red-300 bg-card px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60";

type Result = { ok: true; message?: string } | { ok: false; error: string };

/**
 * Formulário para conceder o papel de administrador da plataforma.
 *
 * Ele NÃO cria conta, NÃO define senha e NÃO gera senha temporária -- de
 * propósito, e a tela fala isso em português. Aqui só se concede permissão.
 */
export function AddPlatformAdminForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState("staff");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);
    startTransition(async () => {
      try {
        const resultado: Result = await addPlatformAdmin({ email, nome, papel });
        if (!resultado.ok) {
          setErro(resultado.error);
          return;
        }
        setSucesso(resultado.message ?? "Permissão concedida.");
        setEmail("");
        setNome("");
        setPapel("staff");
        router.refresh();
      } catch {
        setErro("A ação não pôde ser concluída. Tente de novo em alguns segundos.");
      }
    });
  }

  return (
    <form onSubmit={enviar}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">E-mail da pessoa (obrigatório)</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="pessoa@exemplo.com"
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Nome (opcional)</span>
          <input
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Como você quer ver essa pessoa na lista"
            className={inputClass}
          />
        </label>
      </div>

      <label className="mt-3 block sm:max-w-xs">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Papel</span>
        <select value={papel} onChange={(event) => setPapel(event.target.value)} className={inputClass}>
          <option value="staff">Equipe — administra a plataforma no dia a dia</option>
          <option value="owner">Dono — mesmo nível de quem criou a plataforma</option>
        </select>
      </label>
      <p className="mt-2 text-xs text-muted-foreground">
        Hoje os dois papéis enxergam as mesmas telas. A diferença fica registrada para quando existirem permissões
        separadas — não confie nela como se já fosse uma trava.
      </p>

      <button type="submit" disabled={pending} className={`${primaryButton} mt-4`}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Dar permissão de administrador
      </button>

      {erro ? <p className="mt-3 text-sm text-destructive">{erro}</p> : null}
      {sucesso ? <p className="mt-3 text-sm text-green-700">{sucesso}</p> : null}
    </form>
  );
}

/**
 * Botão de ligar/desligar o acesso de um administrador.
 *
 * A trava de "nunca ficar sem nenhum administrador ativo" é conferida no
 * SERVIDOR, dentro da action. Aqui embaixo só existe o aviso do `confirm()`:
 * se alguém chamar a action por fora da tela, a recusa continua valendo.
 */
export function ToggleAdminAccessButton({
  email,
  ativo,
  ehVoce,
}: {
  email: string;
  ativo: boolean;
  ehVoce: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  function alternar() {
    setErro(null);
    setSucesso(null);

    const pergunta = ativo
      ? ehVoce
        ? `Tirar o SEU PRÓPRIO acesso ao painel da plataforma (${email})?\n\nVocê deixa de entrar aqui na hora. Só outro administrador ativo consegue te devolver o acesso.`
        : `Tirar o acesso de ${email} ao painel da plataforma?\n\nA pessoa deixa de entrar no painel na hora. A conta dela continua existindo — só a permissão sai.`
      : `Devolver o acesso ao painel da plataforma para ${email}?`;

    if (!window.confirm(pergunta)) return;

    startTransition(async () => {
      try {
        const resultado: Result = await setPlatformAdminActive(email, !ativo);
        if (!resultado.ok) {
          setErro(resultado.error);
          return;
        }
        setSucesso(resultado.message ?? "Pronto.");
        router.refresh();
      } catch {
        setErro("A ação não pôde ser concluída. Tente de novo em alguns segundos.");
      }
    });
  }

  return (
    <div className="sm:text-right">
      <button
        type="button"
        disabled={pending}
        onClick={alternar}
        className={`${ativo ? dangerButton : neutralButton} ml-auto`}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {ativo ? "Tirar acesso" : "Devolver acesso"}
      </button>
      {erro ? <p className="mt-2 text-sm text-destructive">{erro}</p> : null}
      {sucesso ? <p className="mt-2 text-sm text-green-700">{sucesso}</p> : null}
    </div>
  );
}
