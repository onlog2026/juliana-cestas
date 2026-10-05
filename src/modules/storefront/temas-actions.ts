"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import { getEntitlements } from "@/modules/entitlements/service";
import { getTema, getVariacao } from "@/storefront/temas/catalogo";
import { planoPermite } from "@/storefront/temas/instalado";
import { instalarNoBanco, voltarNoBanco } from "./temas-instalacao";
import { coresDeEmail } from "@/modules/notifications/cores-email";

type Resultado = { ok: true; mensagem: string } | { ok: false; error: string };

/**
 * Instala um modelo (+ variação) na loja de quem está logado. Guarda o que havia
 * antes dentro do próprio registro (`layout.anterior`) para o "Voltar ao anterior".
 * Produtos, pedidos, fotos e textos NÃO são tocados: só aparência.
 */
export async function instalarModelo(modelo: string, variante: string): Promise<Resultado> {
  const gate = await ensureModuleForAction("templates");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const tema = getTema(modelo);
  if (!tema) return { ok: false, error: "Esse modelo não existe. Atualize a página e tente de novo." };
  const v = getVariacao(tema, variante);

  const ent = await getEntitlements(gate.staff);
  const emTeste = ent.state === "teste";
  if (!gate.staff.isSuperAdmin && !emTeste && !planoPermite(ent.planSlug, tema.plano)) {
    return { ok: false, error: `O modelo ${tema.name} é do plano Pro ou superior. Veja os planos em Sua assinatura.` };
  }

  const r = await instalarNoBanco(createAdminClient(), gate.staff.tenantId, tema.key, v.key, gate.staff.id, {
    cores_email: coresDeEmail(v.paleta),
  });
  if (!r.ok) return r;

  revalidatePath("/", "layout");
  revalidatePath("/admin/modelos");
  return { ok: true, mensagem: `Modelo ${tema.name} · ${v.name} instalado. Seus produtos, pedidos e fotos continuam os mesmos.` };
}

/** Volta ao que a loja tinha antes do modelo novo (ou ao visual de sempre, se não havia nada). */
export async function voltarModelo(): Promise<Resultado> {
  const gate = await ensureModuleForAction("templates");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const r = await voltarNoBanco(createAdminClient(), gate.staff.tenantId, gate.staff.id);
  if (!r.ok) return r;
  revalidatePath("/", "layout");
  revalidatePath("/admin/modelos");
  return { ok: true, mensagem: "Pronto: a loja voltou ao visual anterior." };
}
