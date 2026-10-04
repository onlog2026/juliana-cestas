import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTema, getVariacao } from "@/storefront/temas/catalogo";

export const dynamic = "force-dynamic";

/**
 * "Testar na minha loja": quem já está logado como lojista vai para a PRÉVIA com os
 * produtos dele; quem não tem conta vai criar a loja já com o modelo escolhido.
 * Só redireciona (GET sem efeito colateral); a prévia em si exige sessão de staff.
 */
export async function GET(req: NextRequest) {
  const modelo = req.nextUrl.searchParams.get("modelo") ?? "";
  const tema = getTema(modelo);
  if (!tema) return NextResponse.redirect(new URL("/modelos", req.url));
  const v = getVariacao(tema, req.nextUrl.searchParams.get("variante"));

  let logado = false;
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    logado = Boolean(data.user);
  } catch {
    logado = false;
  }
  const destino = logado ? `/admin/previa/${tema.key}/${v.key}` : `/cadastro?modelo=${tema.key}&variante=${v.key}`;
  return NextResponse.redirect(new URL(destino, req.url));
}
