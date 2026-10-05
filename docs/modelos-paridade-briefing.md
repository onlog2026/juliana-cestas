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

---

# ONDA 2 — adaptar cada modelo ao kit (instruções por modelo)

O kit já existe e compila: `src/storefront/temas/encaixes.ts` (contrato) e `src/storefront/temas/blocos/index.tsx` (blocos de servidor). **Leia os dois antes de começar** e leia também `src/storefront/temas/ao-vivo/*.tsx` para ver COMO eles são chamados (`ProdutoAoVivo` passa `encaixes`, `CategoriaAoVivo` passa `encaixes`, `CarrinhoAoVivo` passa `conteudo`).

## O que cada modelo precisa fazer (sem quebrar a demo)
A demo (`d.demo === true`) e a prévia/loja ao vivo (`d.demo === false`) usam os MESMOS componentes. Regra de ouro: **na demo nada muda** (continua com o carrinho local, o botão `data-acao="comprar"` e os textos de demonstração).

1. **Exportar o cartão do modelo:** `export function Cartao({ p }: { p: ProdutoLoja })` (o mesmo cartão visual que o modelo já usa na categoria/vitrine; em `internas`/`internas/<modelo>.tsx`). O kit passa esse componente aos blocos (`Cartao={Cartao}`).
2. **`Produto` aceita `encaixes?: EncaixesProduto`** (tipo de `@/storefront/temas/encaixes`):
   - se `encaixes?.compra` existir, renderize-o NO LUGAR do botão "Adicionar ao carrinho" do modelo e NÃO renderize o botão de demonstração, a barra fixa de compra do celular de demonstração, nem o link "Ver carrinho" de demonstração (o `compra` real já traz botão + atalhos); mantenha o PREÇO e o título do modelo. Na barra fixa do celular, quando `encaixes?.compra` existir, mostre só preço + um link "Comprar" que leva a `#compra` (âncora no bloco de compra; dê `id="compra"` ao contêiner do encaixe) — nunca `href="#"` vazio.
   - `encaixes?.entrega` (texto "peça até X e receba hoje") logo abaixo do preço/compra; `encaixes?.avaliacoes`, `encaixes?.quemComprou`, `encaixes?.vistos` e `encaixes?.extras` em seções próprias abaixo do conteúdo principal, no estilo do modelo (cada uma envolta num `<section>` com título quando o encaixe vier preenchido; se vier `undefined`, nada é renderizado).
3. **`Categoria` aceita `encaixes?: EncaixesCategoria`:** `filtrosExtras` junto dos filtros; `rodape` no fim da página.
4. **`Carrinho` aceita `conteudo?: ReactNode`:** quando existir, mantenha a casca do modelo (título, espaçamento, fundo, cores) e renderize `conteudo` no lugar do carrinho de demonstração (lista, resumo, aviso "Loja de demonstração", botão "Finalizar") — o `conteudo` real já é o carrinho e o checkout de verdade e traz tudo.
5. **Home (`Home({ d })`) ganha os blocos reais quando `!d.demo`** (na demo não aparecem, porque leem dados da loja ao vivo). No estilo e no ritmo do modelo, inclua (cada um dentro de `{!d.demo ? … : null}`): `BlocoBannersPromo` (topo), `BlocoConfianca`, `BlocoVitrines Cartao={Cartao}`, `BlocoGradeOrdenavel Cartao={Cartao}` (seção "Todas as cestas" com ordenação e filtros), `BlocoAvaliacoes`, `BlocoBeneficios`, `BlocoCartaozinho`, `BlocoFaq`, `BlocoWhatsapp`, `BlocoVistos Cartao={Cartao}`, `JsonLdHome`. Dê a cada bloco um contêiner do modelo (largura `max-w-[2000px]`, espaçamentos, título de seção no tipo do modelo). No `Cabecalho` (em `casca`/`casca.tsx`), quando `!d.demo`, troque a "busca de enfeite" (se o modelo tiver uma) por `BlocoBusca` (e, se o modelo não tiver busca, adicione uma discreta); na demo mantenha como está.
6. **Páginas internas fora do modelo** (conta, avaliações, institucionais) são tratadas por outra frente; não mexa nelas.

## Rodar e conferir
Só `npx tsc --noEmit` (olhe apenas sua área). Não rode build/dev/start/vitest/git. Ao final, releia: nenhuma mudança de comportamento com `d.demo === true`; sem `href="#"`; sem rolagem lateral; todo bloco real entre `{!d.demo ? … : null}`. Relatório curto: o que cada modelo ganhou e onde pôs cada encaixe/bloco.
