# Briefing — site da plataforma (home + páginas de serviço)

Projeto: `C:\Users\user\Downloads\Juliana Cestas` (Next.js 16 App Router, Tailwind v4, TypeScript). O dono **não é dev**. A plataforma vende **lojas virtuais para quem vende cestas e presentes** no Brasil (a Juliana é só UMA lojista). Este briefing vale para os agentes que constroem o **site de venda da plataforma** em domínio próprio (comprado amanhã). Leia também `docs/modelos-briefing.md` (regras de qualidade de front) e o plano `C:\Users\user\.claude\plans\pasted-content-id-a1cf-handoff-calm-pony.md` (seção PACOTE 15).

## Como é hoje (confira lendo o código)
- Landing atual: `src/app/(platform)/plataforma/page.tsx`, seções em `src/components/platform/landing/*` (`header`, `hero`, `audiences`, `features`, `steps`, `plans`, `faq`, `closing`), conteúdo editável em `src/modules/platform/landing-content.ts` / `landing-service.ts` (padrões em `PLATFORM_DEFAULTS`), marca em `/super/marca`. `/planos` reaproveita header, planos e fechamento. `/cadastro`, `/entrar`, `/modelos*`, `/demo/*` existem.
- Os tokens atuais são os da loja da Juliana (verde-oliva). **O site da plataforma terá identidade própria** (veja abaixo) e **não pode herdar** a cara da loja.
- Já existem 102 capturas reais dos 51 modelos de loja em `public/modelos/<modelo>-<variação>-{d,m}.webp` e o catálogo em `src/modules/platform/modelos-catalog.ts` (`MODELOS`). Use-as.
- Preços dos planos vêm do banco (`src/modules/platform/plans-public.ts`); não escreva preço fixo em componente (sempre pelo que o serviço devolver).

## Regras inegociáveis (casa)
1. **Nada de afirmação falsa.** Sem "mil lojas", sem depoimento inventado, sem logos de clientes, sem número que não seja verificável (podem: 51 modelos de loja; 7 dias grátis; planos com preço vindo do banco; PIX/cartão/boleto na conta do próprio lojista). Recurso que ainda não existe aparece como **"Em breve"** (ex.: integração com o ERP Bling).
2. **Nada da Juliana** (marca, fotos de cliente, textos de Brasília). A Juliana só aparece como "lojista" se o dono autorizar — por padrão NÃO aparece.
3. Linguagem: português do Brasil, direta, frases completas, sem jargão; o público é gente que hoje vende pelo Instagram.
4. Sem emoji como ícone (use `lucide-react` e SVG inline); sem gradiente roxo genérico; sem `blur` em elemento fixo; efeitos só por gradiente/`transform`/`opacity`; respeitar `prefers-reduced-motion`.
5. **Mobile primeiro e "cara de app" no celular**: sem rolagem lateral em 360/390/768/1280; toque ≥ 44 px; barra inferior fixa de aplicativo (Início, Recursos, Modelos, Preços, Criar loja) com `safe-area`; CTA primário sempre alcançável; `dvh` em vez de `vh`; imagens com `aspect-ratio`; `next/image` ou `<img>` com `loading="lazy"`/`decoding="async"` (o otimizador padrão da Vercel está desligado: use as imagens já em WebP).
6. Acessibilidade: contraste ≥ 4,5:1, foco visível, `aria-label` em ícones, `alt` útil, ordem de títulos H1→H2→H3, navegação por teclado.
7. **Links**: nunca `href="#"`. Todo link interno aponta para uma página que existe.
8. Código: server components por padrão; interatividade em componentes cliente pequenos; sem dependências novas (Framer Motion só se já estiver no `package.json` — confira; senão use CSS). Sem `<style>{...}</style>` com texto filho (use `dangerouslySetInnerHTML`) — quebra a hidratação.

## Identidade visual da plataforma (escopo próprio)
- Escopo CSS: um invólucro `data-surface="plataforma"` com variáveis próprias (`--p-ink`, `--p-paper`, `--p-accent`, `--p-accent-2`, `--p-line`, `--p-muted`…), definidas num arquivo CSS próprio **importado só pelas páginas da plataforma** (não mexer em `globals.css`).
- Direção: tinta escura profunda + papel claro + um acento quente (açafrão/âmbar) e um segundo acento frio discreto. **Sem roxo.** Tipografia com personalidade: display `Bricolage Grotesque` + texto `DM Sans` (via `next/font/google`, `preload: false`, só carregadas no site da plataforma). Degradês "mesh" por `radial-gradient` sobreposto, grão sutil, sombras multicamada, molduras de aparelho (celular/notebook) feitas em CSS.
- O nome da plataforma vem de `landing-service` (marca editável, hoje "Plataforma"/provisório "Cestas Store"); nunca escreva o nome fixo em vários lugares.

## Estrutura do site (rotas)
Todas dentro do grupo `src/app/(platform)/`. O proxy fará `/` virar a home da plataforma no endereço da plataforma (isso é de outro agente: você só entrega a página em `src/app/(platform)/inicio/page.tsx`, **sem** mexer em proxy). Rotas novas:
- `/inicio` — home (13 seções, ver plano).
- `/recursos` — índice de serviços; `/recursos/[servico]` — uma página por serviço (dirigida por dados em `src/modules/platform/recursos.ts`, com `generateStaticParams`).
- `/solucoes` — índice; `/solucoes/[segmento]` — uma página por situação do lojista (dirigida por dados em `src/modules/platform/solucoes.ts`).
- Páginas existentes (`/planos`, `/modelos`, `/cadastro`, `/entrar`) passam a usar o **mesmo cabeçalho, rodapé e barra de aplicativo** novos (componentes em `src/components/platform/site/`).

## Conteúdo dos serviços (só o que existe hoje; status "disponível"/"em breve")
Disponíveis: Loja online e modelos · Carrinho com várias cestas · Entrega: data, horário e frete por CEP · Cartão de mensagem · Pagamentos PIX, cartão e boleto (Asaas, na conta do lojista) · Avaliações com foto da entrega · Estoque e compras · E-mails automáticos (pedido, pagamento, entrega, pesquisa) · Cupons, tarjas e promoções · SEO e Google (GA4, Search Console) · App no celular (a loja vira aplicativo) · Painel e relatórios · Galeria de 51 modelos · Cestas para empresas (orçamento).
Em breve: Integração com o ERP Bling (pedidos, estoque, produtos, nota fiscal) · recuperação de carrinho com horário fixo.
Cada página de serviço: herói (promessa + CTA "Criar loja grátis"), "o problema", 3 blocos de benefício, imagem real (capturas dos modelos ou prints do painel), "como funciona em 3 passos", perguntas frequentes (3–5), serviços relacionados, CTA final. Soluções por situação: vendo só pelo Instagram · já tenho loja virtual (migrar) · vendo para empresas · floricultura · café colonial e cestas rústicas · presentes corporativos.

## Como trabalhar (IMPORTANTE)
- **Mexa SOMENTE nos arquivos da sua área** (listada no seu pedido). Outros agentes trabalham ao mesmo tempo. Não edite `proxy.ts`, `kit.tsx`, `catalogo.ts`, `globals.css`, scripts, testes nem arquivos de modelos de loja.
- **Não rode `next build`, `next dev`, `next start`, `vitest` nem `git`.** Só `npx tsc --noEmit` (lento; olhe apenas erros das suas pastas).
- Releia seus arquivos no fim procurando: `href="#"`, texto fixo de preço/nome da plataforma, claim falsa, toque < 44 px, imagem sem `alt`.
- Relatório final curto: o que criou (arquivos), decisões, pendências, e o que precisa de dado/imagem que você não tinha.
