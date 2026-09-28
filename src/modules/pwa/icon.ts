import sharp from "sharp";

/**
 * Gerador dos ícones do "app" (tela inicial do celular). Sem `server-only` e
 * sem Next de propósito: recebe bytes e devolve bytes, então é testável por
 * unidade.
 *
 * Origem: o favicon REAL da loja (site_settings.favicon_url). Nada de logo
 * inventada -- só redimensionado, e com margem de segurança na versão
 * "maskable" (Android recorta o ícone em círculo/quadrado arredondado; o que
 * está fora dos 80% centrais pode ser cortado).
 */

export const ICON_SIZES = [180, 192, 512] as const;
export type IconSize = (typeof ICON_SIZES)[number];

/** Cor da marca (verde-oliva) -- fundo quando o favicon é transparente ou some. */
export const BRAND_FALLBACK = { r: 0x55, g: 0x6b, b: 0x2f, alpha: 1 } as const;

type Rgba = { r: number; g: number; b: number; alpha: number };

async function solid(size: number, color: Rgba = BRAND_FALLBACK): Promise<Buffer> {
  return sharp({ create: { width: size, height: size, channels: 3, background: color } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * `favicon` = bytes da imagem da loja (ou null se não há / não deu para baixar).
 * `maskable` = versão com o desenho a 80% do tamanho, centralizado, sobre o
 * mesmo fundo (recorte do Android nunca corta a marca).
 * Nunca lança: qualquer imagem inválida cai no quadrado da cor da marca.
 */
export async function buildIcon(favicon: Buffer | null, size: IconSize, maskable: boolean): Promise<Buffer> {
  if (!favicon) return solid(size);

  try {
    // Cor do fundo = o pixel do canto (o favicon da loja é um quadrado de fundo
    // sólido). Canto transparente -> cor da marca.
    const corner = await sharp(favicon)
      .ensureAlpha()
      .extract({ left: 0, top: 0, width: 1, height: 1 })
      .raw()
      .toBuffer();
    const [r, g, b, a] = corner;
    const background: Rgba = a >= 250 ? { r, g, b, alpha: 1 } : BRAND_FALLBACK;

    const inner = maskable ? Math.round(size * 0.8) : size;
    const icon = await sharp(favicon)
      .resize(inner, inner, { fit: "contain", background })
      .flatten({ background })
      .png({ compressionLevel: 9 })
      .toBuffer();
    if (!maskable) return icon;

    return await sharp({ create: { width: size, height: size, channels: 3, background } })
      .composite([{ input: icon, gravity: "center" }])
      .png({ compressionLevel: 9 })
      .toBuffer();
  } catch {
    return solid(size);
  }
}

/**
 * Só baixamos o favicon do Storage do Supabase da própria plataforma (https e o
 * host de NEXT_PUBLIC_SUPABASE_URL). O endereço vem do banco (gravado pelo
 * painel): sem esta trava, um endereço qualquer viraria uma requisição feita
 * PELO servidor (SSRF).
 */
export function isTrustedFaviconUrl(url: string, supabaseUrl: string | undefined): boolean {
  if (!supabaseUrl) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.host === new URL(supabaseUrl).host;
  } catch {
    return false;
  }
}
