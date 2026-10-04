"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ModeloVitrine } from "@/modules/platform/modelos-catalog";

/** Palco com notebook + celular lado a lado, usando capturas REAIS do modelo. */
export function ModelStage({ modelo }: { modelo: ModeloVitrine }) {
  const [i, setI] = useState(0);
  const n = modelo.telas.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);

  return (
    <section
      className="relative rounded-2xl bg-secondary/70 px-4 pt-8 pb-5 sm:px-12 sm:pt-12"
      aria-label={`Telas do modelo ${modelo.name} no computador e no celular`}
    >
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Tela anterior"
        className="absolute top-1/2 left-3 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background sm:flex"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Próxima tela"
        className="absolute top-1/2 right-3 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background sm:flex"
      >
        <ChevronRight className="size-5" />
      </button>

      <div className="relative pr-[15%] pb-[2%]">
        <div>
          <div className="rounded-t-[14px] bg-[#0b0c0f] p-[2.1%] shadow-[0_30px_60px_-30px_rgba(10,20,40,.45)]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[3px] bg-white">
              {modelo.telas.map((t, k) => (
                // eslint-disable-next-line @next/next/no-img-element -- captura estática, sem otimizador
                <img
                  key={t.desktop}
                  src={t.desktop}
                  alt={`${t.rotulo} no computador`}
                  loading={k ? "lazy" : "eager"}
                  className={`absolute inset-0 size-full object-cover object-top transition-opacity duration-300 ${k === i ? "opacity-100" : "opacity-0"}`}
                />
              ))}
            </div>
          </div>
          <div className="mx-[-7%] h-3.5 rounded-b-[18px] bg-gradient-to-b from-[#d9dbe0] to-[#8b9099]" aria-hidden="true" />
        </div>

        <div className="absolute right-0 bottom-0 w-[23%] rounded-[16%/7.4%] bg-[#0b0c0f] p-[3.4%] shadow-[0_30px_50px_-24px_rgba(10,20,40,.55)]">
          <div className="relative aspect-[390/664] overflow-hidden rounded-[12%/5.6%] bg-white">
            {modelo.telas.map((t, k) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={t.celular}
                src={t.celular}
                alt={`${t.rotulo} no celular`}
                loading={k ? "lazy" : "eager"}
                className={`absolute inset-0 size-full object-cover object-top transition-opacity duration-300 ${k === i ? "opacity-100" : "opacity-0"}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-1.5" role="group" aria-label="Escolher tela">
        {modelo.telas.map((t, k) => (
          <button
            key={t.rotulo}
            type="button"
            aria-pressed={k === i}
            onClick={() => setI(k)}
            className={`min-h-11 rounded-full border px-4 text-sm font-medium ${k === i ? "border-border bg-background text-foreground shadow-sm" : "border-transparent text-muted-foreground"}`}
          >
            {t.rotulo}
          </button>
        ))}
      </div>
    </section>
  );
}
