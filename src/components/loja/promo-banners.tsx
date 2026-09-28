import Image from "next/image";
import Link from "next/link";
import type { StoreContent } from "@/modules/content/types";

type Slot = StoreContent["promo_banners"]["wide"];

/**
 * Um banner promocional. `href` vazio = imagem sem link; caminho interno usa
 * `Link`; https abre em nova aba. Sem `priority`: fica no meio da página,
 * abaixo da dobra -- carrega sob demanda.
 */
function PromoSlot({ slot, className, sizes }: { slot: Slot; className: string; sizes: string }) {
  const alt = slot.alt.trim() || "Promoção";
  const boxClass = `group relative block overflow-hidden rounded-card bg-secondary ${className}`;
  const imageClass = "object-cover transition-transform duration-300 group-hover:scale-105";

  // Foto própria para o celular (opcional): a do computador esconde no celular.
  const images = slot.mobileImageUrl ? (
    <>
      <Image src={slot.mobileImageUrl} alt={alt} fill sizes="100vw" className={`${imageClass} sm:hidden`} />
      <Image src={slot.imageUrl} alt={alt} fill sizes={sizes} className={`${imageClass} hidden sm:block`} />
    </>
  ) : (
    <Image src={slot.imageUrl} alt={alt} fill sizes={sizes} className={imageClass} />
  );

  const href = slot.href.trim();
  if (!href) return <div className={boxClass}>{images}</div>;
  if (/^https:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={boxClass}>
        {images}
      </a>
    );
  }
  return (
    <Link href={href} className={boxClass}>
      {images}
    </Link>
  );
}

/**
 * Os dois banners que ficam no meio da grade de produtos da home: um LARGO
 * (2/3 da largura no computador) e um ESTREITO (1/3), com a mesma altura.
 * No celular ficam um embaixo do outro. Slot sem imagem não aparece; se só
 * um tiver imagem, ele ocupa a largura toda. Desligado, não renderiza nada.
 *
 * Proporções recomendadas para as imagens (o painel mostra isto também):
 * larga 1600×800 (2:1), estreita 800×800 (1:1).
 */
export function PromoBanners({ promo }: { promo: StoreContent["promo_banners"] }) {
  if (!promo.enabled) return null;
  const wide = promo.wide.imageUrl ? promo.wide : null;
  const narrow = promo.narrow.imageUrl ? promo.narrow : null;
  if (!wide && !narrow) return null;
  const both = Boolean(wide && narrow);

  // Lado a lado (2/3 + 1/3) já a partir do tablet (640px): empilhados, o estreito
  // viraria um bloco de 700×530 num tablet. Só no celular ficam um embaixo do outro.
  return (
    <div className={`grid gap-4 ${both ? "sm:grid-cols-3" : ""}`}>
      {wide ? (
        <PromoSlot
          slot={wide}
          className={both ? "aspect-[16/9] sm:col-span-2 sm:aspect-[2/1]" : "aspect-[16/9] sm:aspect-[3/1]"}
          sizes={both ? "(min-width: 640px) 66vw, 100vw" : "100vw"}
        />
      ) : null}
      {narrow ? (
        <PromoSlot
          slot={narrow}
          // Lado a lado, a estreita estica até a altura da larga (a linha da
          // grade manda); por isso `aspect-auto` + `h-full` a partir de sm.
          className={both ? "aspect-[4/3] sm:aspect-auto sm:h-full" : "aspect-[16/9] sm:aspect-[3/1]"}
          sizes={both ? "(min-width: 640px) 33vw, 100vw" : "100vw"}
        />
      ) : null}
    </div>
  );
}
