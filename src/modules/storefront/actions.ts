"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import { switchTemplate, undoTemplateSwitch } from "@/modules/storefront/service";
import { getTemplate, isTemplateKey } from "@/storefront/templates/index";

/**
 * Ações da tela de modelos.
 *
 * Arquivo com `"use server"` só exporta função `async` -- nem tipo, nem
 * constante, nem objeto. Tudo que é exportado daqui vira um endpoint que o
 * navegador pode chamar; exportar outra coisa quebra o build do Next.
 *
 * A LOJA VEM SEMPRE DA SESSÃO (`gate.staff.tenantId`), nunca de um parâmetro.
 * Se a loja viesse do navegador, qualquer pessoa logada em uma loja trocaria o
 * modelo de outra só mudando o corpo da requisição.
 *
 * NOTA sobre `revalidatePath`: hoje a vitrine ainda é montada por
 * `src/app/(store)/page.tsx` e não lê `store_pages`, então limpar o cache da
 * home não teria efeito nenhum. No dia em que o renderizador for ligado (veja
 * o cabeçalho de `src/storefront/renderer.tsx`), acrescente aqui
 * `revalidatePath("/", "layout")` -- sem isso a lojista troca de modelo e o
 * site continua mostrando o anterior até o cache expirar.
 */

export async function aplicarModelo(
  key: string
): Promise<{ ok: true; mensagem: string } | { ok: false; error: string }> {
  const gate = await ensureModuleForAction("templates");
  if (!gate.ok) return { ok: false, error: gate.mensagem };

  if (!isTemplateKey(key)) {
    return { ok: false, error: "Esse modelo não existe. Atualize a página e tente de novo." };
  }

  const resultado = await switchTemplate(gate.staff.tenantId, key, gate.staff.id);
  if (!resultado.ok) return resultado;

  revalidatePath("/admin/modelos");

  const modelo = getTemplate(key);
  return {
    ok: true,
    mensagem: `Modelo "${modelo?.name ?? key}" aplicado. Seus produtos, pedidos e fotos continuam os mesmos.`,
  };
}

export async function desfazerTrocaDeModelo(): Promise<
  { ok: true; mensagem: string } | { ok: false; error: string }
> {
  const gate = await ensureModuleForAction("templates");
  if (!gate.ok) return { ok: false, error: gate.mensagem };

  const resultado = await undoTemplateSwitch(gate.staff.tenantId, gate.staff.id);
  if (!resultado.ok) return resultado;

  revalidatePath("/admin/modelos");
  return { ok: true, mensagem: "Pronto: o modelo anterior voltou, do jeito que estava." };
}
