"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { instalarModelo, voltarModelo } from "@/modules/storefront/temas-actions";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Item = { key: string; nome: string; cor: string };

/**
 * Barra fixa da PRÉVIA com os produtos do próprio lojista: nada muda na loja até ele
 * clicar em "Instalar este modelo" (confirma no meio da tela). "Voltar ao anterior"
 * desfaz. Computador e celular.
 */
export function PreviaBar({
  modelo, nomeModelo, variante, variacoes, instaladoAgora, temAnterior, bloqueado, exemplo,
}: {
  modelo: string; nomeModelo: string; variante: string; variacoes: Item[];
  /** Este modelo + variação já é o instalado. */
  instaladoAgora: boolean;
  /** Existe um modelo novo instalado (dá para voltar). */
  temAnterior: boolean;
  /** Plano atual não inclui este modelo. */
  bloqueado: boolean;
  /** A loja ainda não tem cestas: a prévia usa cestas de exemplo. */
  exemplo: boolean;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const confirm = useConfirm();
  const [pendente, start] = useTransition();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const prefixo = `/admin/previa/${modelo}/${variante}`;
  const resto = pathname.startsWith(prefixo) ? pathname.slice(prefixo.length) : "";

  async function instalar() {
    setAviso(null);
    const r = await confirm({
      title: `Instalar o modelo ${nomeModelo}?`,
      description: "Sua loja passa a usar este visual. Produtos, pedidos, fotos e textos continuam os mesmos, e você pode voltar ao anterior quando quiser.",
      confirmLabel: "Instalar na minha loja",
      cancelLabel: "Ainda não",
    });
    if (!r.ok) return;
    start(async () => {
      const res = await instalarModelo(modelo, variante);
      setAviso({ ok: res.ok, texto: res.ok ? res.mensagem : res.error });
      if (res.ok) router.refresh();
    });
  }

  function voltar() {
    setAviso(null);
    start(async () => {
      const res = await voltarModelo();
      setAviso({ ok: res.ok, texto: res.ok ? res.mensagem : res.error });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div role="region" aria-label="Barra da prévia" className="fixed inset-x-0 top-0 z-50 text-white" style={{ background: "#0f1b2d", fontFamily: "system-ui, sans-serif" }}>
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-5">
        <Link href="/admin/modelos" className="flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium opacity-90">
          <span aria-hidden="true">←</span><span className="hidden sm:inline">Modelos</span>
        </Link>
        <p className="hidden shrink-0 text-sm font-semibold md:block">Prévia · {nomeModelo}</p>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Variações">
          {variacoes.map((v) => (
            <Link key={v.key} href={`/admin/previa/${modelo}/${v.key}${resto}`} scroll={false} onClick={() => window.scrollTo(0, 0)} aria-current={v.key === variante} className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm whitespace-nowrap" style={{ borderColor: v.key === variante ? "#fff" : "rgba(255,255,255,.3)", background: v.key === variante ? "rgba(255,255,255,.14)" : "transparent" }}>
              <span className="size-3 rounded-full" style={{ background: v.cor, boxShadow: "0 0 0 1px rgba(255,255,255,.6)" }} aria-hidden="true" />{v.nome}
            </Link>
          ))}
        </div>
        {temAnterior ? (
          <button type="button" onClick={voltar} disabled={pendente} className="min-h-11 shrink-0 rounded-lg border border-white/40 px-3 text-sm font-medium disabled:opacity-60">
            <span className="sm:hidden">Voltar</span><span className="hidden sm:inline">Voltar ao anterior</span>
          </button>
        ) : null}
        {instaladoAgora ? (
          <span className="shrink-0 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold">Instalado ✓</span>
        ) : bloqueado ? (
          <Link href="/admin/assinatura" className="min-h-11 shrink-0 rounded-lg px-3 py-2.5 text-sm font-semibold" style={{ background: "#ffb800", color: "#141414" }}>Plano Pro</Link>
        ) : (
          <button type="button" onClick={instalar} disabled={pendente} className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold disabled:opacity-60 sm:px-4" style={{ background: "#ffb800", color: "#141414" }}>
            {pendente ? "Instalando…" : <><span className="sm:hidden">Instalar</span><span className="hidden sm:inline">Instalar este modelo</span></>}
          </button>
        )}
      </div>
      {exemplo || aviso ? (
        <p role="status" className="px-4 pb-2 text-center text-sm" style={{ color: aviso ? (aviso.ok ? "#9be7b0" : "#ffb4b4") : "#cdd6e3" }}>
          {aviso ? aviso.texto : "Você ainda não tem cestas cadastradas: a prévia usa cestas de exemplo. Quando cadastrar as suas, elas aparecem aqui."}
        </p>
      ) : null}
    </div>
  );
}
