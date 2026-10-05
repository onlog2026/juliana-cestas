import Link from "next/link";
import { getTenantId } from "@/lib/tenant/context";
import { getSocialLinks } from "@/modules/settings/social-links";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { getStoreProfile, formatStoreAddress } from "@/modules/settings/store-profile";
import { SocialIcons } from "@/components/loja/social-icons";
import { formatCnpj } from "@/modules/seo/schema";
import { whatsappDigits } from "@/modules/notifications/templates/shell";
import { ehLojaOriginal, fraseRodape, localRodape } from "@/modules/seo/texto-legado";

const columns = [
  {
    title: "Ajuda",
    links: [
      { href: "/atendimento", label: "Atendimento" },
      { href: "/faq", label: "Perguntas frequentes" },
    ],
  },
  {
    title: "Institucional",
    links: [
      { href: "/sobre", label: "Sobre a loja" },
      { href: "/trocas-e-devolucoes", label: "Trocas e entregas" },
      { href: "/privacidade", label: "Política de Privacidade" },
      { href: "/termos", label: "Termos de uso" },
    ],
  },
];

export async function SiteFooter() {
  // A loja vem do endereço acessado (visitante anônimo, sem login).
  const tenantId = await getTenantId();
  const [socialLinks, siteSettings, storeProfile] = await Promise.all([
    getSocialLinks(tenantId),
    getSiteSettings(tenantId),
    getStoreProfile(tenantId),
  ]);
  const address = formatStoreAddress(storeProfile);
  const storeName = storeProfile.businessName?.trim() || "";
  const cnpj = formatCnpj(storeProfile.document);
  const wa = whatsappDigits(storeProfile.phone);

  return (
    // pb-20 no mobile: o BottomNav fixo (h-16 = 64px) cobriria o fim do rodapé;
    // o respiro tira o texto de baixo do menu. No desktop (md) não há BottomNav.
    <footer className="border-t border-border bg-secondary/60 pb-20 md:pb-0">
      <div className="mx-auto grid max-w-[1800px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:px-8 2xl:px-12">
        <div>
          {siteSettings.logoFooterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- pode ser GIF animado
            <img src={siteSettings.logoFooterUrl} alt={storeName ? `Logo ${storeName}` : "Logo da loja"} className="h-14 w-auto object-contain md:h-16" />
          ) : (
            <p className="font-display text-2xl text-primary">{storeName}</p>
          )}
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            {fraseRodape(tenantId, storeProfile)}
          </p>
          <SocialIcons links={socialLinks} className="mt-4" />
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold text-foreground">
              {col.title}
            </p>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="jc-nav-hover -mx-2 -my-1 rounded-full px-2 py-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="text-sm font-semibold text-foreground">
            Contato e horário
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {address ??
              (ehLojaOriginal(tenantId) ? (
                <>
                  QNL 7 Bloco D, Edifício São Raimundo
                  <br />
                  Brasília, DF
                </>
              ) : null)}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Retirada das 8h às 18h
            <br />
            Segunda a sábado
            <br />
            Domingo (sob agendamento)
          </p>
          {storeProfile.phone || storeProfile.email ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {wa ? (
                <a href={`https://wa.me/${wa}`} className="font-medium text-foreground hover:text-primary">
                  WhatsApp: {storeProfile.phone}
                </a>
              ) : (
                storeProfile.phone
              )}
              {storeProfile.phone && storeProfile.email ? <br /> : null}
              {storeProfile.email ? (
                <a href={`mailto:${storeProfile.email}`} className="hover:text-primary">
                  {storeProfile.email}
                </a>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground sm:px-6 lg:px-8 2xl:px-12">
        © {new Date().getFullYear()}{storeName ? ` ${storeName}` : ""}
        {cnpj ? ` · CNPJ ${cnpj}` : ""}.{localRodape(tenantId, storeProfile)}
      </div>
    </footer>
  );
}
