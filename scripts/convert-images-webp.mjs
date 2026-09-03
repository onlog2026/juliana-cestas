// Converte todas as imagens PNG/JPEG de public/images para WebP e apaga os
// originais. Uso: node scripts/convert-images-webp.mjs
import sharp from "sharp";
import { readdir, unlink, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(process.cwd(), "public", "images");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (/\.(png|jpe?g)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

async function main() {
  const files = await walk(ROOT);
  console.log(`Encontrados ${files.length} arquivos pra converter.`);

  for (const file of files) {
    const outFile = file.replace(/\.(png|jpe?g)$/i, ".webp");
    const before = (await stat(file)).size;
    await sharp(file).webp({ quality: 82 }).toFile(outFile);
    const after = (await stat(outFile)).size;
    await unlink(file);
    console.log(
      `${path.relative(ROOT, file)} -> ${path.relative(ROOT, outFile)} (${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB)`
    );
  }
  console.log("Concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
