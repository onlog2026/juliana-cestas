import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function toWebp(url) {
  return url ? url.replace(/\.(png|jpe?g)$/i, ".webp") : url;
}

async function main() {
  const { data: products, error: pErr } = await supabase.from("products").select("id, image_url");
  if (pErr) throw pErr;
  for (const p of products ?? []) {
    const next = toWebp(p.image_url);
    if (next && next !== p.image_url) {
      const { error } = await supabase.from("products").update({ image_url: next }).eq("id", p.id);
      if (error) throw error;
      console.log("product", p.id, p.image_url, "->", next);
    }
  }

  const { data: banners, error: bErr } = await supabase.from("banners").select("id, image_url");
  if (bErr) throw bErr;
  for (const b of banners ?? []) {
    const next = toWebp(b.image_url);
    if (next && next !== b.image_url) {
      const { error } = await supabase.from("banners").update({ image_url: next }).eq("id", b.id);
      if (error) throw error;
      console.log("banner", b.id, b.image_url, "->", next);
    }
  }
  console.log("Concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
