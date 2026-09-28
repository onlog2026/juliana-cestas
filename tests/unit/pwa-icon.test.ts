import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { buildIcon, isTrustedFaviconUrl } from "@/modules/pwa/icon";
import { shortHash } from "@/modules/pwa/version";

async function sample(color: { r: number; g: number; b: number }, size = 256) {
  return sharp({ create: { width: size, height: size, channels: 3, background: color } }).png().toBuffer();
}

describe("buildIcon", () => {
  it("gera PNG no tamanho pedido a partir do favicon", async () => {
    const out = await buildIcon(await sample({ r: 10, g: 60, b: 30 }), 192, false);
    const meta = await sharp(out).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(["png", 192, 192]);
  });

  it("maskable: mantém o tamanho e a cor de fundo nas bordas (margem de segurança)", async () => {
    const out = await buildIcon(await sample({ r: 10, g: 60, b: 30 }), 512, true);
    const meta = await sharp(out).metadata();
    expect([meta.width, meta.height]).toEqual([512, 512]);
    const { data } = await sharp(out).raw().toBuffer({ resolveWithObject: true });
    expect([data[0], data[1], data[2]]).toEqual([10, 60, 30]);
  });

  it("sem favicon ou com arquivo inválido: quadrado da cor da marca, nunca lança", async () => {
    for (const input of [null, Buffer.from("isto não é imagem")]) {
      const out = await buildIcon(input, 180, false);
      const { data, info } = await sharp(out).raw().toBuffer({ resolveWithObject: true });
      expect(info.width).toBe(180);
      expect([data[0], data[1], data[2]]).toEqual([0x55, 0x6b, 0x2f]);
    }
  });
});

describe("isTrustedFaviconUrl (trava contra SSRF)", () => {
  const sb = "https://oygizajevizwhiymgsly.supabase.co";
  it("aceita só https no host do Supabase da plataforma", () => {
    expect(isTrustedFaviconUrl(`${sb}/storage/v1/object/public/site-media/f.png`, sb)).toBe(true);
    expect(isTrustedFaviconUrl("http://oygizajevizwhiymgsly.supabase.co/x.png", sb)).toBe(false);
    expect(isTrustedFaviconUrl("https://evil.example.com/x.png", sb)).toBe(false);
    expect(isTrustedFaviconUrl("https://169.254.169.254/latest", sb)).toBe(false);
    expect(isTrustedFaviconUrl("não é url", sb)).toBe(false);
    expect(isTrustedFaviconUrl(`${sb}/x.png`, undefined)).toBe(false);
  });
});

describe("shortHash", () => {
  it("é estável e muda quando o endereço muda", () => {
    expect(shortHash("a")).toBe(shortHash("a"));
    expect(shortHash("a")).not.toBe(shortHash("b"));
  });
});
