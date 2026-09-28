import Link from "next/link";
import { User } from "lucide-react";
import { getTenantId } from "@/lib/tenant/context";
import { getAllProducts } from "@/modules/catalog/service";
import { getActiveCategoryTree } from "@/modules/catalog/categories";
import { getSocialLinks } from "@/modules/settings/social-links";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { getContent } from "@/modules/content/service";
import { HeaderSearch } from "@/components/loja/header-search";
import { HeaderNavMenu } from "@/components/loja/header-nav-menu";
import { MobileNavMenu } from "@/components/loja/mobile-nav-menu";
import { CartButton } from "@/components/loja/cart-button";
import { InstagramLink } from "@/components/loja/social-icons";
import { AnnouncementBar } from "@/components/loja/announcement-bar";
import { HeaderLogo } from "@/components/loja/header-logo-editable";

export async function SiteHeader() {
  // A loja vem do endereço acessado (visitante anônimo, sem login).
  const tenantId = await getTenantId();
  const [products, categoryTree, socialLinks, siteSettings, storeProfile, announcement] = await Promise.all([
    getAllProducts(tenantId),
    getActiveCategoryTree(tenantId),
    getSocialLinks(tenantId),
    getSiteSettings(tenantId),
    getStoreProfile(tenantId),
    getContent(tenantId, "announcement"),
  ]);
  // Nome da loja atual. Vazio enquanto o lojista nao preencher o perfil --
  // nesse caso o link fica so com o logo, sem inventar marca nenhuma.
  const storeName = storeProfile.businessName?.trim() || "";

  // A busca (componente de cliente) só precisa destes 5 campos. Passar o
  // produto inteiro (itens, descrição, embalagem, galeria...) fazia o servidor
  // serializar TODOS os produtos completos no HTML de TODA página da loja (o
  // cabeçalho está no layout). Uma lista só, compartilhada pelas duas
  // instâncias (celular e computador): o React não a repete no payload.
  const searchProducts = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    serves: p.serves,
    price: p.price,
    image: p.image,
  }));

  // Menu do topo em formato guarda-chuva: categoria principal -> subcategorias.
  // Passa só os campos que o menu (client) precisa -- categories.ts é
  // server-only e não pode cruzar a fronteira como objeto inteiro.
  const navCategories = categoryTree.map((top) => ({
    slug: top.slug,
    name: top.name,
    imageUrl: top.imageUrl,
    children: top.children.map((sub) => ({ slug: sub.slug, name: sub.name, imageUrl: sub.imageUrl })),
  }));

  return (
    <>
    {/* A faixa de cima agora é SÓ para avisos (campo em CMS). Fica fora do
        <header> sticky: rola com a página e não come altura da tela. O
        Instagram foi para a linha principal, ao lado do carrinho. */}
    <AnnouncementBar announcement={announcement} />
    {/* Fundo sólido, sem backdrop-filter: `backdrop-saturate` num elemento
        sticky causa jank de rolagem no mobile (mesma família do blur que a
        regra da casa proíbe em fixed/sticky). */}
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-2 sm:px-6 lg:px-8">
        {/* Sem altura fixa de propósito: a lojista agora escolhe o tamanho da
            logo (controle na própria home), então a barra precisa acompanhar
            -- `py-2` reproduz exatamente a altura de antes (96px) no tamanho
            padrão (80px), e cresce ou encolhe sozinha se ela mudar o tamanho. */}
        <HeaderLogo
          logoHeaderUrl={siteSettings.logoHeaderUrl}
          logoFooterUrl={siteSettings.logoFooterUrl}
          faviconUrl={siteSettings.faviconUrl}
          logoHeaderHeight={siteSettings.logoHeaderHeight}
          storeName={storeName}
        />

        <div className="hidden flex-1 justify-center md:flex">
          <div className="w-full max-w-md">
            <HeaderSearch products={searchProducts} id="header-search-desktop" />
          </div>
        </div>

        <nav className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
          <InstagramLink url={socialLinks.instagram} />
          <CartButton />
          <Link
            href="/conta"
            className="jc-nav-hover flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-foreground"
            aria-label="Minha conta"
          >
            <User className="size-5" />
            Minha conta
          </Link>
        </nav>

        {/* Cluster do celular: carrinho (sempre) + hambúrguer de categorias (só
            se houver categorias). ml-auto empurra pra direita quando a busca e a
            conta ficam escondidas no mobile. O menu do desktop é o HeaderNavMenu
            abaixo (hidden md:block). O Instagram NÃO fica aqui no celular: a
            logo é larga (até 320px) e três ícones ao lado dela encavalam nela
            em 375px -- no celular ele vai dentro do menu ☰ (e no rodapé). */}
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <CartButton />
          {navCategories.length > 0 ? (
            <MobileNavMenu categories={navCategories} instagramUrl={socialLinks.instagram} />
          ) : null}
        </div>
      </div>

      {navCategories.length > 0 ? (
        <div className="hidden border-t border-border md:block">
          <HeaderNavMenu categories={navCategories} />
        </div>
      ) : null}

      <div className="border-t border-border px-4 py-2.5 md:hidden">
        <HeaderSearch products={searchProducts} id="header-search-mobile" />
      </div>
    </header>
    </>
  );
}
