import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTenantId } from "@/lib/tenant/context";
import { getStoreProfile } from "@/modules/settings/store-profile";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getStoreProfile(await getTenantId());
  const storeName = profile.businessName?.trim() || "nossa loja";
  return {
    title: "Termos de Uso",
    description: `Termos e condições de compra e uso do site da ${storeName}.`,
    alternates: { canonical: "/termos" },
  };
}

export default async function TermosPage() {
  const profile = await getStoreProfile(await getTenantId());
  const storeName = profile.businessName?.trim() || "Nossa loja";
  const email = profile.email?.trim() || "";
  const phone = profile.phone?.trim() || "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Termos de Uso</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl text-foreground md:text-4xl">Termos de Uso</h1>
      <p className="mt-4 text-muted-foreground">
        Estes termos regem a compra e o uso do site da {storeName}. Ao navegar ou fazer um pedido, você
        concorda com as condições abaixo.
      </p>

      <div className="mt-6 space-y-6 text-sm text-muted-foreground">
        <section>
          <p className="font-semibold text-foreground">1. Produtos</p>
          <p className="mt-1">
            Trabalhamos com cestas de café da manhã, presentes e kits comemorativos, com opções de
            personalização. As imagens são ilustrativas; pequenas variações de itens podem ocorrer conforme a
            disponibilidade, sempre preservando o valor e a proposta da cesta.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground">2. Pedidos e preços</p>
          <p className="mt-1">
            Os preços e a disponibilidade podem mudar sem aviso prévio. O pedido só é confirmado após a
            aprovação do pagamento. Podemos recusar ou cancelar um pedido em caso de erro evidente de preço,
            indisponibilidade ou suspeita de fraude.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground">3. Pagamento</p>
          <p className="mt-1">
            O pagamento é processado por um provedor especializado. Não armazenamos os dados completos do seu
            cartão.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground">4. Entrega</p>
          <p className="mt-1">
            A entrega segue a região, a data e o horário escolhidos no checkout. É responsabilidade do cliente
            informar corretamente o endereço e os dados de quem vai receber.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground">5. Trocas e devoluções</p>
          <p className="mt-1">
            As regras de troca e devolução estão descritas na página{" "}
            <Link href="/trocas-e-devolucoes" className="font-medium text-primary hover:underline">
              Trocas e entregas
            </Link>
            .
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground">6. Conteúdo do site</p>
          <p className="mt-1">
            Textos, imagens, marca e layout do site pertencem à {storeName} e não podem ser copiados ou usados
            sem autorização.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground">7. Contato</p>
          <p className="mt-1">
            Precisa falar com a gente?
            {email ? <> E-mail: <span className="text-foreground">{email}</span>.</> : null}
            {phone ? <> Telefone/WhatsApp: <span className="text-foreground">{phone}</span>.</> : null}
          </p>
        </section>

        <p className="pt-2 text-xs">
          Vigente desde setembro de 2026. Podemos atualizar estes termos; a versão mais recente estará sempre
          nesta página.
        </p>
      </div>
    </div>
  );
}
