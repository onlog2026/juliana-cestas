import sharp from "sharp";

export const runtime = "nodejs";

const ALLOWED_HOST = "oygizajevizwhiymgsly.supabase.co";
const ALLOWED_PREFIX = "/storage/v1/object/public/";
const WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1600, 1920, 2048, 3840];
const MAX_BYTES = 15 * 1024 * 1024;

function redirect(original: string) {
  // Falhou? Serve o original (nunca deixa a foto quebrada).
  return new Response(null, { status: 302, headers: { Location: original, "Cache-Control": "public, max-age=60" } });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url") ?? "";
  const w = Number(searchParams.get("w"));
  const q = Math.min(90, Math.max(40, Number(searchParams.get("q")) || 75));

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("url inválida", { status: 400 });
  }
  if (target.protocol !== "https:" || target.hostname !== ALLOWED_HOST || !target.pathname.startsWith(ALLOWED_PREFIX)) {
    return new Response("origem não permitida", { status: 400 });
  }
  if (!WIDTHS.includes(w)) return new Response("largura não permitida", { status: 400 });
  // SVG/GIF (animado) ficam como estão.
  if (/\.(svg|gif)$/i.test(target.pathname)) return redirect(target.toString());

  try {
    const res = await fetch(target.toString());
    if (!res.ok) return redirect(target.toString());
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) return redirect(target.toString());
    const input = Buffer.from(await res.arrayBuffer());
    if (input.length > MAX_BYTES) return redirect(target.toString());
    const out = await sharp(input).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: q }).toBuffer();
    return new Response(new Uint8Array(out), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        Vary: "Accept",
      },
    });
  } catch {
    return redirect(target.toString());
  }
}
