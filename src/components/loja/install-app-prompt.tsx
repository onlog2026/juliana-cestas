"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const CHAVE_FECHOU = "jc-app-fechou-em";
const CHAVE_VISITAS = "jc-app-visitas";
const DIAS_SEM_MOSTRAR = 30;

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}
function gravar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* navegação privada: sem memória, segue sem quebrar */
  }
}

/**
 * Oferta "Instale o app da loja" para o CLIENTE FINAL, só no celular:
 *  - Android/Chrome: usa o convite nativo do navegador (`beforeinstallprompt`);
 *  - iPhone/Safari: mostra o passo a passo (Compartilhar → Adicionar à Tela de Início);
 *  - nunca no computador, nunca dentro do app já instalado;
 *  - aparece na 2ª visita ou depois de 30 s navegando; fechou → some por 30 dias.
 * Fica acima da barra inferior da loja (64px) e respeita a área segura do iPhone.
 */
export function InstallAppPrompt({ storeName }: { storeName: string }) {
  const [aberto, setAberto] = useState(false);
  const [modo, setModo] = useState<"android" | "ios" | "manual">("manual");
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const celular = window.matchMedia("(max-width: 767px)").matches && "ontouchstart" in window;
    const instalado =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!celular || instalado) return;

    const fechou = Number(ler(CHAVE_FECHOU) || 0);
    if (fechou && Date.now() - fechou < DIAS_SEM_MOSTRAR * 86400000) return;

    const visitas = Number(ler(CHAVE_VISITAS) || 0) + 1;
    gravar(CHAVE_VISITAS, String(visitas));

    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
    setModo(ios ? "ios" : "manual");

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
      setModo("android");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const timer = window.setTimeout(() => setAberto(true), visitas >= 2 ? 4000 : 30000);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.clearTimeout(timer);
    };
  }, []);

  function fechar() {
    gravar(CHAVE_FECHOU, String(Date.now()));
    setAberto(false);
  }

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    const escolha = await evento.userChoice.catch(() => ({ outcome: "dismissed" }));
    if (escolha.outcome === "accepted") setAberto(false);
    else fechar();
  }

  if (!aberto) return null;
  return (
    <div
      role="dialog"
      aria-label={`Instalar o app da ${storeName}`}
      className="fixed inset-x-3 z-50 rounded-2xl border border-border bg-card p-4 shadow-[0_18px_40px_-16px_rgba(0,0,0,.45)] md:hidden"
      style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
    >
      <button type="button" onClick={fechar} aria-label="Fechar" className="absolute top-1.5 right-1.5 flex size-11 items-center justify-center text-muted-foreground">
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Download className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">Instale o app da {storeName}</p>
          <p className="text-sm text-muted-foreground">Abra a loja direto da tela inicial, sem procurar o link.</p>
        </div>
      </div>
      {modo === "android" ? (
        <button type="button" onClick={instalar} className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
          Instalar app
        </button>
      ) : modo === "ios" ? (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-foreground">
          Toque em <Share className="size-4" aria-label="Compartilhar" /> <b>Compartilhar</b> e depois em
          <SquarePlus className="size-4" aria-hidden="true" /> <b>Adicionar à Tela de Início</b>.
        </p>
      ) : (
        <p className="mt-3 text-sm text-foreground">
          No menu do navegador (<b>⋮</b>), toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.
        </p>
      )}
    </div>
  );
}
