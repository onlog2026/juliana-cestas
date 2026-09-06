"use server";

import "server-only";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createStoreForUser,
  normalizeSlug,
  painelUrlDaLoja,
  validateSlug,
  RESERVED_SLUGS,
} from "@/modules/platform/onboarding";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * As duas únicas portas que o navegador tem para o cadastro de loja.
 *
 * Regra que vale para as duas: **quem está logado sai de `auth.getUser()` no
 * servidor, nunca de um campo do formulário.** Se `criarMinhaLoja` aceitasse
 * um `userId`, qualquer pessoa criaria loja no nome de outra — e o dono da
 * loja seria escolhido por quem manda o POST.
 *
 * Arquivo `"use server"`: só exporta função `async`. Tipos e constantes moram
 * em `onboarding.ts` de propósito — tudo que é exportado daqui vira endpoint
 * público.
 */

/* ─────────────────────── Conferir o endereço enquanto digita ───────────── */

/**
 * Responde "esse endereço pode?" para a tela, enquanto a pessoa digita.
 *
 * É público de propósito (quem está cadastrando ainda não tem sessão em todos
 * os casos) e por isso só faz leitura, só devolve sim/não e nunca conta QUAL
 * loja ocupa o endereço — dizer "essa é a loja X" transformaria o formulário
 * num diretório de lojas para quem estivesse sondando.
 */
export async function verificarEnderecoDaLoja(
  textoDigitado: string
): Promise<{ slug: string; disponivel: boolean; mensagem: string | null }> {
  const slug = normalizeSlug(typeof textoDigitado === "string" ? textoDigitado.slice(0, 200) : "");

  const formato = validateSlug(slug, RESERVED_SLUGS);
  if (!formato.ok) return { slug, disponivel: false, mensagem: formato.mensagem };

  const admin = createAdminClient();

  // Lista de reservados que cresce sem deploy (migração 0029). A lista do
  // código já foi conferida acima e cobre tudo que está na migração; esta é a
  // segunda camada, para o que for acrescentado depois.
  //
  // Falha de leitura aqui NÃO bloqueia o cadastro de propósito: enquanto a
  // migração 0029 não tiver rodado, a tabela não existe, e travar todo mundo
  // por causa disso seria derrubar o cadastro inteiro sem necessidade — a
  // lista do código continua valendo, e a gravação confere tudo de novo.
  const { data: reservado, error: erroReservado } = await admin
    .from("reserved_slugs")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (erroReservado) {
    console.error("[onboarding] não consegui ler reserved_slugs (usando só a lista do código):", erroReservado);
  }
  if (reservado) {
    return { slug, disponivel: false, mensagem: "Esse endereço é reservado pelo sistema. Escolha outro." };
  }

  const { data: ocupado, error } = await admin.from("tenants").select("id").eq("slug", slug).maybeSingle();

  if (error) {
    console.error("[onboarding] falha ao conferir o endereço:", error);
    return { slug, disponivel: false, mensagem: "Não consegui conferir o endereço agora. Tente de novo." };
  }

  if (ocupado) {
    return { slug, disponivel: false, mensagem: "Esse endereço já é de outra loja. Escolha outro." };
  }

  return { slug, disponivel: true, mensagem: null };
}

/* ──────────────────────────── Criar a loja ─────────────────────────────── */

/**
 * O contrato do formulário. Cinco campos — e só.
 *
 * O zod descarta qualquer chave a mais que venha no corpo do POST, então nem
 * por acidente um `plano`, `subscription_status` ou `trial_ends_at` mandado
 * pelo navegador chega ao banco. Quem decide teste e plano é o servidor.
 */
const entradaSchema = z.object({
  nome: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(1).max(200),
  nicho: z.string().trim().min(2).max(40),
  whatsapp: z.string().trim().min(8).max(30),
  cidade: z.string().trim().min(2).max(60),
});

export async function criarMinhaLoja(entrada: unknown): Promise<
  | {
      ok: true;
      slug: string;
      nome: string;
      trialEndsAt: string | null;
      jaExistia: boolean;
      /** `null` quando a plataforma ainda não tem domínio configurado. */
      painelUrl: string | null;
    }
  | { ok: false; error: string; campo?: string }
> {
  const parsed = entradaSchema.safeParse(entrada);
  if (!parsed.success) {
    return { ok: false, error: "Confira os dados da loja: falta preencher algum campo." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sua sessão expirou. Entre de novo e continue de onde parou." };
  }

  const resultado = await createStoreForUser(user.id, {
    nome: parsed.data.nome,
    slug: parsed.data.slug,
    nicho: parsed.data.nicho,
    whatsapp: parsed.data.whatsapp,
    cidade: parsed.data.cidade,
  });

  if (!resultado.ok) return { ok: false, error: resultado.error, campo: resultado.campo };

  return {
    ok: true,
    slug: resultado.store.slug,
    nome: resultado.store.nome,
    trialEndsAt: resultado.store.trialEndsAt,
    jaExistia: resultado.store.jaExistia,
    painelUrl: montarPainelUrl(resultado.store.slug),
  };
}

/**
 * O endereço do painel da loja recém-criada.
 *
 * Loja recém-criada nunca é a loja legada — por isso `false` no segundo
 * parâmetro. A regra em si mora em `painelUrlDaLoja`, para a tela de login e a
 * de cadastro não terem cada uma a sua versão dela.
 */
function montarPainelUrl(slug: string): string | null {
  return painelUrlDaLoja(slug, false, getEnv().PLATFORM_DOMAIN);
}
