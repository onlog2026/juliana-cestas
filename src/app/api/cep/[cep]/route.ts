import { NextResponse } from "next/server";
import { checkRateLimit, clientIp } from "@/lib/security/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cep: string }> }
) {
  const { cep } = await params;
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) {
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 });
  }

  const withinLimit = await checkRateLimit(`cep:${clientIp(req)}`, 60, 60);
  if (!withinLimit) {
    return NextResponse.json({ error: "Muitas consultas. Espera um pouco." }, { status: 429 });
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });

    const data = await res.json();
    if (!data || data.erro) {
      return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar o CEP agora" }, { status: 502 });
  }
}
