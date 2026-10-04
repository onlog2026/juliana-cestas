"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ModeloVitrine } from "@/modules/platform/modelos-catalog";

/**
 * Página do modelo no padrão de loja de temas: notebook + celular com capturas
 * REAIS da loja demo, e chips de variação que trocam as capturas, o link da
 * demo e o "Criar loja" (que leva modelo + variação para o cadastro).
 */
export function ModelStage({ modelo, ficha }: { modelo: ModeloVitrine; ficha: ReactNode }) {
  const [i, setI] = useState(0);
  const n = modelo.telas.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);
  const atual = modelo.telas[i];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-14">
      <section
        className="relative rounded-2xl bg-secondary/70 px-4 pt-8 pb-6 sm:px-12 sm:pt-12"
        aria-label={`Modelo ${modelo.name}, variação ${atual.rotulo}, no computador e no celular`}
      >
        <button type="button" onClick={() => go(-1)} aria-label="Variação anterior" className="absolute top-1/2 left-3 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background sm:flex">
          <ChevronLeft className="size-5" />
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Próxima variação" className="absolute top-1/2 right-3 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background sm:flex">
          <ChevronRight className="size-5" />
        </button>

        <div className="relative pr-[15%] pb-[2%]">
          <div>
            <div className="rounded-t-[14px] bg-[#0b0c0f] p-[2.1%] shadow-[0_30px_60px_-30px_rgba(10,20,40,.45)]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[3px] bg-white">
                {modelo.telas.map((t, k) => (
                  // eslint-disable-next-line @next/next/no-img-element -- captura estática, sem otimizador
                  <img key={t.desktop} src={t.desktop} alt={`${modelo.name} ${t.rotulo} no computador`} loading={k ? "lazy" : "eager"} className={`absolute inset-0 size-full object-cover object-top transition-opacity duration-300 ${k === i ? "opacity-100" : "opacity-0"}`} />
                ))}
              </div>
            </div>
            <div className="mx-[-7%] h-3.5 rounded-b-[18px] bg-gradient-to-b from-[#d9dbe0] to-[#8b9099]" aria-hidden="true" />
          </div>
          <div className="absolute right-0 bottom-0 w-[23%] rounded-[16%/7.4%] bg-[#0b0c0f] p-[3.4%] shadow-[0_30px_50px_-24px_rgba(10,20,40,.55)]">
            <div className="relative aspect-[390/664] overflow-hidden rounded-[12%/5.6%] bg-white">
              {modelo.telas.map((t, k) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={t.celular} src={t.celular} alt={`${modelo.name} ${t.rotulo} no celular`} loading={k ? "lazy" : "eager"} className={`absolute inset-0 size-full object-cover object-top transition-opacity duration-300 ${k === i ? "opacity-100" : "opacity-0"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Sobre o modelo" className="pt-1">
        {ficha}
        <p className="mt-6 text-sm font-semibold text-foreground">Variações</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Escolher variação">
          {modelo.telas.map((t, k) => (
            <button key={t.key} type="button" aria-pressed={k === i} onClick={() => setI(k)} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium ${k === i ? "border-foreground text-foreground" : "border-border text-muted-foreground"}`}>
              <span className="size-3.5 rounded-full" style={{ background: t.cor }} aria-hidden="true" />
              {t.rotulo}
            </button>
          ))}
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link href={`/cadastro?modelo=${modelo.key}&variante=${atual.key}`} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground">
            Criar loja com este modelo
          </Link>
          <a href={atual.demo} target="_blank" rel="noopener" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-foreground px-5 font-semibold text-foreground">
            Ver loja demo
          </a>
        </div>
      </section>
    </div>
  );
}
