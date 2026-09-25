import type { CardTemplate } from "@/modules/cards/templates";
import { CardPattern } from "@/components/loja/checkout/card-pattern";
import { THEME_ART, THEME_STYLE } from "@/components/loja/card-art";

/**
 * O cartãozinho, inteiro. Um só componente para os três lugares onde ele
 * aparece (prévia no checkout, confirmação do pedido, "minha conta"), então
 * nunca divergem.
 *
 * Tema novo: ilustração de topo + saudação + mensagem + ilustração de rodapé,
 * cada tema com layout, papel, moldura e cores próprios. Modelo antigo (pedido
 * já feito com "clássico", "botânico"…): mantém o desenho de sempre.
 * `compact` mostra só topo + saudação + rodapé (miniatura de escolha).
 */
export function CardFace({
  template,
  message,
  recipient,
  sender,
  storeName,
  compact = false,
  className = "",
}: {
  template: CardTemplate;
  message?: string;
  recipient?: string;
  sender?: string | null;
  storeName?: string;
  compact?: boolean;
  className?: string;
}) {
  const theme = template.theme;

  // ── modelo antigo ────────────────────────────────────────────────────────
  if (!theme) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border px-8 py-8 ${template.paperClass} ${template.borderClass} ${className}`}
        style={{ boxShadow: "var(--jc-shadow)" }}
      >
        <CardPattern template={template} />
        <p className="relative font-display text-lg leading-relaxed text-[#3a3226]">{message}</p>
        <p className="relative mt-6 font-display text-base text-[#3a3226]">
          Para {recipient}
          {sender ? `, de ${sender}` : ""}.
        </p>
        <p className="relative mt-8 text-xs uppercase tracking-[0.12em] text-[#8a7d5f]">{storeName}</p>
      </div>
    );
  }

  // ── tema novo ────────────────────────────────────────────────────────────
  const st = THEME_STYLE[theme];
  const { Top, Bottom, Mark } = THEME_ART[theme];
  const align = st.align === "left" ? "text-left" : "text-center";

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl ${className}`}
      style={{ background: st.paper, border: st.border, color: st.ink, boxShadow: "var(--jc-shadow)" }}
    >
      {Mark && !compact ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07]" aria-hidden="true">
          <Mark />
        </div>
      ) : null}

      <div className="relative flex flex-1 flex-col justify-between">
        <Top />
        <div className={`${compact ? "px-2 py-1" : "px-6 pb-1 pt-1 sm:px-8"} ${align}`}>
          <p
            className={`font-display leading-tight ${compact ? "text-[10px] font-semibold" : "text-2xl"} ${
              st.italic ? "italic" : ""
            } ${st.upper ? (compact ? "uppercase tracking-wide" : "uppercase tracking-[0.14em]") : ""}`}
            style={{ color: st.greeting, ...(st.upper && !compact ? { fontSize: "1.1rem" } : null) }}
          >
            {template.greeting}
          </p>

          {compact ? null : (
            <>
              <p className="mt-4 whitespace-pre-line font-display text-lg leading-relaxed">{message}</p>
              <p className="mt-5 font-display text-base" style={{ color: st.sub }}>
                Para {recipient}
                {sender ? `, de ${sender}` : ""}.
              </p>
              {storeName ? (
                <p className="mt-5 text-[11px] uppercase tracking-[0.14em]" style={{ color: st.sub }}>
                  {storeName}
                </p>
              ) : null}
            </>
          )}
        </div>
        <Bottom />
      </div>
    </div>
  );
}
