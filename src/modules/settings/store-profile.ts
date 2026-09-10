import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type StoreProfile = {
  businessName: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  cep: string | null;
  street: string | null;
  addressNumber: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
};

const EMPTY: StoreProfile = {
  businessName: null,
  document: null,
  email: null,
  phone: null,
  cep: null,
  street: null,
  addressNumber: null,
  complement: null,
  neighborhood: null,
  city: null,
  state: null,
};

export async function getStoreProfile(tenantId: string): Promise<StoreProfile> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("store_profile")
    .select(
      "business_name, document, email, phone, cep, street, address_number, complement, neighborhood, city, state"
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) return EMPTY;

  return {
    businessName: data.business_name,
    document: data.document,
    email: data.email,
    phone: data.phone,
    cep: data.cep,
    street: data.street,
    addressNumber: data.address_number,
    complement: data.complement,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
  };
}

/**
 * O WhatsApp da loja em formato `wa.me` (só dígitos, ex.: `5561999894889`),
 * lido do CADASTRO DA LOJA no banco -- não mais de `NEXT_PUBLIC_WHATSAPP`.
 *
 * Por quê: a variável de ambiente é "assada" no build da Vercel, então trocar
 * o número exigia editar a Vercel + republicar (frágil, e a lojista não tem
 * como fazer). Vindo do banco, o número muda pelo próprio cadastro da loja e
 * vale na hora, sem tocar em deploy. É o que o TODO "F2" espalhado pelos
 * componentes já previa.
 *
 * `""` quando não há telefone cadastrado -- quem consome trata isso e não
 * mostra botão de WhatsApp quebrado (mesmo comportamento de antes com o env
 * vazio).
 */
export async function getStoreWhatsapp(tenantId: string): Promise<string> {
  const profile = await getStoreProfile(tenantId);
  return (profile.phone ?? "").replace(/\D/g, "");
}

/** Uma linha pronta pra exibir ("Rua X, 123 — Bairro, Cidade/UF"), ou null se não tem endereço cadastrado ainda. */
export function formatStoreAddress(profile: StoreProfile): string | null {
  if (!profile.street) return null;
  const line1 = [profile.street, profile.addressNumber].filter(Boolean).join(", ");
  const line2 = [profile.neighborhood, [profile.city, profile.state].filter(Boolean).join("/")]
    .filter(Boolean)
    .join(", ");
  return [line1, line2].filter(Boolean).join(" — ");
}
