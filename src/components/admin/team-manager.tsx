"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Mail, Pencil, Plus, RotateCw, Trash2, UserRound, X } from "lucide-react";
import {
  atualizarPermissoes,
  cancelarConvite,
  convidarPessoa,
  definirPessoaAtiva,
  excluirMembro,
  reenviarConvite,
} from "@/modules/team/actions";
import type { LimiteEquipe, ModuloParaPermissao, TeamInvite, TeamMember, TeamRole } from "@/modules/team/service";

/**
 * EQUIPE DA LOJA.
 *
 * Três coisas que esta tela deixa explícitas para quem não é dev:
 *
 *  1. **Ninguém recebe senha por aqui.** O convite chega por e-mail e a própria
 *     pessoa escolhe a senha dela. A tela diz isso com todas as letras, porque
 *     a pergunta "e qual a senha dela?" é a primeira que aparece.
 *  2. **Marcar nada = ver quase nada.** As caixinhas mostram só o que a LOJA
 *     tem no plano, e o que fica desmarcado fica fechado. Deixar tudo em branco
 *     não libera o painel inteiro.
 *  3. **O limite do plano aparece escrito**, inclusive quando não existe limite
 *     -- em vez de a lojista descobrir o teto só quando o botão para de funcionar.
 */
export function TeamManager({
  members: initialMembers,
  invites: initialInvites,
  limite,
  modulos,
  meuId,
}: {
  members: TeamMember[];
  invites: TeamInvite[];
  limite: LimiteEquipe;
  modulos: ModuloParaPermissao[];
  meuId: string;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [convidando, setConvidando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);
  useEffect(() => {
    setInvites(initialInvites);
  }, [initialInvites]);

  function aoSalvar() {
    setEditandoId(null);
    setConvidando(false);
    router.refresh();
  }

  function alternarAtiva(membro: TeamMember) {
    setErro(null);
    const desativando = membro.active;
    if (desativando && !confirm(`Desativar ${membro.name?.trim() || membro.email || "esta pessoa"}?`)) return;

    startTransition(async () => {
      const resultado = await definirPessoaAtiva({ id: membro.id, active: !membro.active });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      router.refresh();
    });
  }

  function excluir(membro: TeamMember) {
    setErro(null);
    const nome = membro.name?.trim() || membro.email || "esta pessoa";
    if (
      !confirm(
        `Excluir ${nome} da equipe? Essa ação NÃO tem volta -- ao contrário de desativar, não dá para trazer de volta depois. A pessoa perde o acesso a esta loja imediatamente.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const resultado = await excluirMembro(membro.id);
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      setMembers((atual) => atual.filter((m) => m.id !== membro.id));
      router.refresh();
    });
  }

  function reenviar(id: string) {
    setErro(null);
    startTransition(async () => {
      const resultado = await reenviarConvite(id);
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      router.refresh();
    });
  }

  function cancelar(id: string) {
    setErro(null);
    if (!confirm("Cancelar este convite? A pessoa não vai perder o acesso se já tiver entrado.")) return;
    startTransition(async () => {
      const resultado = await cancelarConvite(id);
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      setInvites((atual) => atual.filter((c) => c.id !== id));
      router.refresh();
    });
  }

  const pendentes = invites.filter((c) => !c.aceito);

  return (
    <div className="space-y-6">
      <div className="rounded-[10px] border border-border bg-background p-4">
        <p className="text-sm text-foreground">{limite.mensagem}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Hoje: {limite.ativos} {limite.ativos === 1 ? "pessoa ativa" : "pessoas ativas"}
          {limite.convitesPendentes > 0
            ? ` e ${limite.convitesPendentes} ${limite.convitesPendentes === 1 ? "convite enviado" : "convites enviados"} aguardando resposta`
            : ""}
          .
        </p>
      </div>

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      <div className="space-y-3">
        {members.map((membro) =>
          editandoId === membro.id ? (
            <PessoaForm
              key={membro.id}
              membro={membro}
              modulos={modulos}
              onSaved={aoSalvar}
              onCancel={() => setEditandoId(null)}
            />
          ) : (
            <div
              key={membro.id}
              className="flex flex-col gap-3 rounded-[10px] border border-border bg-background p-3 sm:flex-row sm:items-center"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <UserRound className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {membro.name?.trim() || membro.email || "Sem nome"}
                  {membro.id === meuId ? (
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
                      você
                    </span>
                  ) : null}
                  {!membro.active ? (
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
                      desativada
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">{membro.email ?? "sem e-mail"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {membro.role === "admin"
                    ? "Dona da loja — acessa tudo"
                    : resumoPermissoes(membro.allowedModules, modulos)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setEditandoId(membro.id)}
                  aria-label={`Editar ${membro.name ?? membro.email ?? "pessoa"}`}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => alternarAtiva(membro)}
                  disabled={pending}
                  className="flex h-9 items-center rounded-full border border-border px-3 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-40"
                >
                  {pending ? <Loader2 className="size-4 animate-spin" /> : membro.active ? "Desativar" : "Reativar"}
                </button>
                <button
                  type="button"
                  onClick={() => excluir(membro)}
                  disabled={pending || members.length <= 1}
                  aria-label={`Excluir ${membro.name?.trim() || membro.email || "pessoa"} da equipe`}
                  title={
                    members.length <= 1
                      ? "Esta é a única pessoa da equipe -- sempre precisa sobrar pelo menos uma."
                      : "Excluir da equipe (não tem volta)"
                  }
                  className="flex size-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10 disabled:opacity-30"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {convidando ? (
        <PessoaForm modulos={modulos} onSaved={aoSalvar} onCancel={() => setConvidando(false)} />
      ) : limite.podeConvidar ? (
        <button
          type="button"
          onClick={() => setConvidando(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm font-medium text-foreground hover:bg-accent"
        >
          <Plus className="size-4" /> Convidar alguém
        </button>
      ) : null}

      {pendentes.length > 0 ? (
        <section>
          <h2 className="font-display text-lg text-foreground">Convites enviados</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enquanto a pessoa não clicar no link do e-mail e criar a senha dela, ela ainda não consegue entrar.
          </p>
          <ul className="mt-3 space-y-2">
            {pendentes.map((convite) => (
              <li
                key={convite.id}
                className="flex flex-col gap-2 rounded-[10px] border border-border bg-background p-3 sm:flex-row sm:items-center"
              >
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{convite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {convite.vencido ? "Convite vencido — reenvie para gerar um link novo." : "Aguardando resposta."}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => reenviar(convite.id)}
                    disabled={pending}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-40"
                  >
                    <RotateCw className="size-3.5" /> Reenviar
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelar(convite.id)}
                    disabled={pending}
                    aria-label={`Cancelar convite de ${convite.email}`}
                    className="flex size-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10 disabled:opacity-40"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function resumoPermissoes(slugs: string[], modulos: ModuloParaPermissao[]): string {
  if (slugs.length === 0) return "Acessa só o básico: início, pedidos, produtos e configurações.";
  const nomes = slugs.map((slug) => modulos.find((m) => m.slug === slug)?.name ?? slug);
  return `Também acessa: ${nomes.join(", ")}.`;
}

function PessoaForm({
  membro,
  modulos,
  onSaved,
  onCancel,
}: {
  membro?: TeamMember;
  modulos: ModuloParaPermissao[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState(membro?.email ?? "");
  const [name, setName] = useState(membro?.name ?? "");
  const [role, setRole] = useState<TeamRole>(membro?.role ?? "staff");
  const [marcados, setMarcados] = useState<string[]>(membro?.allowedModules ?? []);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function alternar(slug: string) {
    setMarcados((atual) => (atual.includes(slug) ? atual.filter((s) => s !== slug) : [...atual, slug]));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const resultado = membro
        ? await atualizarPermissoes({ id: membro.id, name, role, allowedModules: marcados })
        : await convidarPessoa({ email, name, role, allowedModules: marcados });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-4 rounded-[10px] border border-border bg-background p-4">
      <p className="text-sm font-medium text-foreground">
        {membro ? "Editar pessoa da equipe" : "Convidar alguém para a equipe"}
      </p>

      {membro ? null : (
        <div>
          <label htmlFor="equipe-email" className="mb-1.5 block text-sm font-medium text-foreground">
            E-mail da pessoa
          </label>
          <input
            id="equipe-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@empresa.com.br"
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3 text-sm text-foreground"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            A pessoa vai receber um convite neste e-mail e escolher a senha dela mesma. Você não precisa criar
            nem enviar senha nenhuma.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="equipe-nome" className="mb-1.5 block text-sm font-medium text-foreground">
          Nome (opcional)
        </label>
        <input
          id="equipe-nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Como você chama essa pessoa"
          className="h-11 w-full rounded-[10px] border border-border bg-card px-3 text-sm text-foreground"
        />
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-foreground">Tipo de acesso</legend>
        <div className="space-y-2">
          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="equipe-papel"
              checked={role === "staff"}
              onChange={() => setRole("staff")}
              className="mt-1 size-4"
            />
            <span>
              Equipe
              <span className="block text-xs text-muted-foreground">
                Acessa o básico (início, pedidos, produtos, configurações) mais o que você marcar abaixo.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="equipe-papel"
              checked={role === "admin"}
              onChange={() => setRole("admin")}
              className="mt-1 size-4"
            />
            <span>
              Dona da loja
              <span className="block text-xs text-muted-foreground">
                Acessa tudo e pode convidar e remover pessoas. Só dê isso a quem é responsável pela loja.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {role === "staff" ? (
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-foreground">O que mais essa pessoa pode abrir</legend>
          {modulos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Seu plano não tem nenhuma tela extra para liberar hoje. Essa pessoa vai acessar o básico da loja.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {modulos.map((modulo) => (
                <label
                  key={modulo.slug}
                  className="flex items-start gap-2 rounded-[10px] border border-border bg-card p-3 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={marcados.includes(modulo.slug)}
                    onChange={() => alternar(modulo.slug)}
                    className="mt-0.5 size-4 rounded border-border"
                  />
                  <span className="min-w-0">
                    {modulo.name}
                    <span className="block text-xs text-muted-foreground">{modulo.description}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            O que ficar desmarcado fica fechado para essa pessoa. Deixar tudo em branco não libera o painel
            inteiro.
          </p>
        </fieldset>
      ) : null}

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {membro ? "Salvar" : "Enviar convite"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-medium text-foreground hover:bg-accent"
        >
          <X className="size-4" /> Cancelar
        </button>
      </div>
    </form>
  );
}
