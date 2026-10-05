# Briefing — paridade de funcionalidades dos 17 modelos (loja ao vivo)

Projeto: `C:\Users\user\Downloads\Juliana Cestas`. Leia antes: `docs/modelos-briefing.md` (regras de front), o inventário no plano `C:\Users\user\.claude\plans\pasted-content-id-a1cf-handoff-calm-pony.md` (seção PACOTE 14).

## Objetivo
Hoje, quando um lojista instala um modelo, só mudam cabeçalho, rodapé e home. **As páginas reais da loja (cesta, categoria, carrinho, checkout, conta, avaliações) e vários recursos da vitrine da Juliana não existem nos modelos.** A meta: **qualquer modelo instalado entrega TUDO que a loja da Juliana entrega**, por lojista, reaproveitando os componentes REAIS (nunca reescrever lógica de dinheiro). O modelo só decide aparência e posição.

## Arquitetura (já decidida)
1. **Kit de blocos funcionais** em `src/storefront/temas/blocos/` (componentes de SERVIDOR, `tenantId` via `getTenantId()`, cores só por `var(--t-*)`):
   - `BlocoBusca` (usa `HeaderSearch` de `components/loja/header-search.tsx`; produtos leves via `lite-product.ts`),
   - `BlocoVitrines` (usa `getShowcases` de `modules/catalog/showcases.ts` + `ShowcaseRow`/`ShowcaseCarousel`),
   - `BlocoVistos` (`RecentlyViewed`/`TrackRecentlyViewed`), `BlocoAvaliacoes` (`ReviewsShowcase`), `BlocoConfianca` (`TrustBar`), `BlocoBeneficios` (`Benefits`), `BlocoFaq` (`Faq`), `BlocoWhatsapp` (`WhatsappCta`), `BlocoCartaozinho` (`CartaozinhoSection`), `BlocoBannersPromo` (`PromoBanners`),
   - `BlocoGradeOrdenavel` (usa `sort-products.ts`/`filterEntries` com o cartão do modelo),
   - `JsonLdHome` (`WebSiteJsonLd` + `ItemListJsonLd`), `RastreioCesta` (`TrackViewItem`, `TrackedProductLink` nos cartões).
   Cada bloco recebe o **cartão do modelo** como componente (o modelo desenha o cartão; o bloco traz dados e comportamento) e marca `data-recurso="<nome>"` no elemento raiz (usado pelo teste de paridade).
2. **Páginas reais dentro do modelo:** as rotas `src/app/(store)/{produto/[slug],categoria/[slug],carrinho,conta/**,avaliacoes,sobre,faq,...}` continuam a fonte da verdade (SEO, JSON-LD, `generateMetadata`, `revalidate`). Quando há modelo instalado, cada rota renderiza o conteúdo REAL **dentro de um "invólucro de página" do modelo** (título, espaçamento, cores, fundo) e, para cesta/categoria, usa o layout do modelo com **encaixes** (`compra`, `entrega`, `avaliacoes`, `relacionados`, `quemComprou`, `vistos`) preenchidos com os componentes reais (`AddToCartButton`, `DeliveryToday`, `ItemIcon`, `ReviewsShowcase`, `getAlsoBought`, `RecentlyViewed`, `ProductJsonLd`, `TrackViewItem`). **Carrinho e checkout reais** (`components/loja/cart/*`, `checkout/*`) ficam intactos, dentro da casca.
3. **Sem modelo instalado = a loja de hoje, sem nenhuma mudança** (a Juliana não tem modelo). Isso é inegociável: nenhum arquivo da loja original muda de comportamento.

## Regras
- Mexa SOMENTE na sua área (listada no pedido). Não edite `kit.tsx`, `comum.tsx`, `catalogo.ts`, `fonts.ts`, `proxy.ts`, scripts nem testes, a menos que o pedido diga.
- Não rode `next build`/`dev`/`start`/`vitest`/`git`. Só `npx tsc --noEmit` (olhe só erros da sua área).
- Servidor → cliente: só dados e elementos já renderizados como props (nunca funções).
- `<style>` com CSS: `dangerouslySetInnerHTML`. Sem `href="#"`. Toque ≥ 44 px. Sem rolagem lateral. Contraste ≥ 4,5.
- Relatório final curto (arquivos, decisões, pendências).
