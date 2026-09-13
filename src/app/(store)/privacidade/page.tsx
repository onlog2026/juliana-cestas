import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTenantId } from "@/lib/tenant/context";
import { getStoreProfile, formatStoreAddress } from "@/modules/settings/store-profile";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getStoreProfile(await getTenantId());
  const storeName = profile.businessName?.trim() || "nossa loja";
  return {
    title: "Política de Privacidade",
    description: `Como a ${storeName} coleta, usa e protege os seus dados pessoais, conforme a LGPD.`,
    alternates: { canonical: "/privacidade" },
  };
}

export default async function PrivacidadePage() {
  const profile = await getStoreProfile(await getTenantId());
  const storeName = profile.businessName?.trim() || "Nossa loja";
  const email = profile.email?.trim() || "";
  const phone = profile.phone?.trim() || "";
  const address = formatStoreAddress(profile);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Política de Privacidade</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl text-foreground md:text-4xl">Política de Privacidade</h1>
      <p className="mt-4 text-muted-foreground">
        Esta política explica como a {storeName} coleta, usa, compartilha e protege as suas informações
        pessoais quando você navega no site, faz um pedido ou fala com a gente. Tratamos os seus dados de
        acordo com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).
      </p>

      <div className="mt-6 space-y-6 text-sm text-muted-foreground">
        <section>
          <p className="font-semibold text-foreground">1. Dados que coletamos</p>
          <p className="mt-1">
            Coletamos apenas o necessário para atender o seu pedido: nome, telefone/WhatsApp, e-mail, CPF
            (quando exigido para o pagamento), endereço de entrega e os dados do pedido (itens, mensagem do
            cartão, data e horário de entrega). Também coletamos dados de navegação (como páginas visitadas)
            por meio de cookies.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground">2. Como usamos os seus dados</p>
          <p className="mt-1">
            Usamos as suas informações para processar e entregar o pedido, emitir o pagamento, manter você
            informado sobre o andamento, prestar atendimento, cumprir obrigações legais e melhorar a sua
            experiência na loja.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground">3. Compartilhamento</p>
          <p className="mt-1">
            Compartilhamos os seus dados apenas com quem é necessário para concluir o pedido — por exemplo, o
            provedor de pagamento e o serviço de entrega —, sempre limitado ao mínimo indispensável. Nunca
            vendemos os seus dados.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground">4. Cookies</p>
          <p className="mt-1">
            Utilizamos cookies essenciais para o funcionamento do site (como manter o seu carrinho) e, quando
            aplicável, cookies de medição para entender como o site é usado. Você pode gerenciar os cookies
            nas configurações do seu navegador.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground">5. Os seus direitos (LGPD)</p>
          <p className="mt-1">
            Você pode, a qualquer momento, solicitar acesso aos seus dados, correção, exclusão, portabilidade
            ou revogar um consentimento. Para exercer esses direitos, fale com a gente pelos contatos abaixo.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground">6. Segurança e retenção</p>
          <p className="mt-1">
            Adotamos medidas razoáveis para proteger as suas informações e mantemos os dados apenas pelo tempo
            necessário para atender ao pedido e cumprir obrigações legais.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground">7. Contato</p>
          <p className="mt-1">
            Dúvidas sobre privacidade ou os seus dados? Fale com a {storeName}
            {email ? <> pelo e-mail <span className="text-foreground">{email}</span></> : null}
            {phone ? <> ou pelo telefone/WhatsApp <span className="text-foreground">{phone}</span></> : null}.
            {address ? <> Endereço: {address}.</> : null}
          </p>
        </section>

        <p className="pt-2 text-xs">
          Vigente desde setembro de 2026. Podemos atualizar esta política; a versão mais recente estará sempre
          nesta página.
        </p>
      </div>
    </div>
  );
}
