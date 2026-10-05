import sharp from "sharp";
import { inicialDaMarca, nomeDaMarca, svgDoIcone } from "@/modules/platform/seo-plataforma";

/**
 * Ícones do app da PLATAFORMA (não da loja): 180 (iPhone), 192, 512 e maskable-512.
 * Desenhados na hora a partir de um SVG simples com a inicial da marca.
 */
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ size: "180" }, { size: "192" }, { size: "512" }, { size: "maskable-512" }];
}

const TAMANHOS = [180, 192, 512];

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const maskable = raw.startsWith("maskable-");
  const size = Number(raw.replace("maskable-", ""));
  if (!TAMANHOS.includes(size)) return new Response("Não encontrado", { status: 404 });

  const svg = svgDoIcone(inicialDaMarca(await nomeDaMarca()), size, maskable);
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
