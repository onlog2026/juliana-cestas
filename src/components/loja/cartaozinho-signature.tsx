"use client";

import { useState } from "react";

export function CartaozinhoSignature() {
  const [name, setName] = useState("Marina");
  const [message, setMessage] = useState(
    "Que seu dia comece tão doce quanto esse café."
  );

  return (
    <section className="bg-secondary/40">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <h2 className="font-display text-3xl text-foreground">
            Monte o cartãozinho da sua cesta
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            Toda cesta Juliana Cestas vai com um cartão de mensagem. Escreva
            para quem vai receber e veja o cartão ganhar forma, ali na tela.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Nome de quem vai receber
              </span>
              <input
                value={name}
                maxLength={40}
                onChange={(event) => setName(event.target.value)}
                className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Ex: Marina"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Mensagem
              </span>
              <textarea
                value={message}
                maxLength={180}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                className="w-full resize-none rounded-[10px] border border-border bg-card px-3.5 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Escreva a mensagem do cartão"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <div
            className="jc-glow-card w-full max-w-sm rounded-2xl border border-[color-mix(in_oklch,var(--primary),transparent_80%)] bg-[var(--jc-paper)] px-8 py-10"
            style={{ boxShadow: "var(--jc-shadow)" }}
          >
            <p className="font-display text-xl leading-relaxed text-[#3a3226]">
              {message || "Sua mensagem aparece aqui."}
            </p>
            <p className="mt-6 font-display text-lg text-[#3a3226]">
              Para {name || "quem você ama"}, com carinho.
            </p>
            <p className="mt-8 text-xs uppercase tracking-[0.12em] text-[#8a7d5f]">
              Juliana Cestas
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
