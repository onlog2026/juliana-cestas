import sharp from "sharp";
import { getTenantId } from "@/lib/tenant/context";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { isTrustedFaviconUrl } from "@/modules/pwa/icon";

/**
 * Logo para os E-MAILS: sempre PNG com fundo transparente.
 *
 * A logo do site é WebP (leve para a loja), mas os clientes de e-mail lidam mal
 * com WebP transparente: o Gmail desenhou a logo dentro de um retângulo PRETO e
 * espremida. PNG transparente é o formato que todo cliente de e-mail entende.
 * Largura 440 px (o e-mail mostra a 220 px: nítida em tela retina).
 *
 * Pré-gerada e renovada a cada 24 h (trocou a logo no painel, o e-mail acompanha).
 */
export const revalidate = 86400;

export async function GET() {
  try {
    const settings = await getSiteSettings(await getTenantId());
    const url = settings.logoHeaderUrl;
    if (!url || !isTrustedFaviconUrl(url, process.env.NEXT_PUBLIC_SUPABASE_URL)) {
      return new Response("Sem logo", { status: 404 });
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return new Response("Sem logo", { status: 404 });
    const source = Buffer.from(await res.arrayBuffer());
    if (source.length > 8 * 1024 * 1024) return new Response("Sem logo", { status: 404 });

    const png = await sharp(source)
      .resize({ width: 440, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response("Sem logo", { status: 404 });
  }
}
