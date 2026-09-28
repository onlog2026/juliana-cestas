import { getTenantId } from "@/lib/tenant/context";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { ICON_SIZES, buildIcon, isTrustedFaviconUrl, type IconSize } from "@/modules/pwa/icon";

/**
 * Ícones do app da loja (tela inicial do celular), gerados do favicon da loja:
 *   /pwa-icon/180            apple-touch-icon (iPhone)
 *   /pwa-icon/192, /512      ícones do manifesto
 *   /pwa-icon/maskable-512   versão com margem de segurança (Android recorta)
 *
 * Pré-gerado no build e renovado a cada 24 h; trocou o favicon, as URLs do
 * manifesto ganham `?v=` novo (o parâmetro é ignorado aqui de propósito -- ler
 * a URL tornaria a rota dinâmica).
 */
export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ size: "180" }, { size: "192" }, { size: "512" }, { size: "maskable-512" }];
}

const MAX_FAVICON_BYTES = 5 * 1024 * 1024;

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const maskable = raw.startsWith("maskable-");
  const size = Number(raw.replace("maskable-", ""));
  if (!(ICON_SIZES as readonly number[]).includes(size)) {
    return new Response("Não encontrado", { status: 404 });
  }

  let favicon: Buffer | null = null;
  try {
    const settings = await getSiteSettings(await getTenantId());
    const url = settings.faviconUrl;
    if (url && isTrustedFaviconUrl(url, process.env.NEXT_PUBLIC_SUPABASE_URL)) {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const bytes = Buffer.from(await res.arrayBuffer());
        if (bytes.length > 0 && bytes.length <= MAX_FAVICON_BYTES) favicon = bytes;
      }
    }
  } catch {
    // Sem favicon (ou rede caiu): o ícone sai no fundo da cor da marca.
  }

  const png = await buildIcon(favicon, size as IconSize, maskable);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
