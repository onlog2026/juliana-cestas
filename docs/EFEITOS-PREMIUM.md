# Biblioteca de efeitos premium — prompts prontos para reusar em outro projeto

Estes efeitos foram extraídos do código real do Agentop (`apd-clinical-saas/src/index.css`) e adaptados
para a paleta da Juliana Present (verde-cerrado `#1f4d3a` + ipê-amarelo `#d9a441`). Estão implementados
neste projeto em `src/app/globals.css` (classes `jc-*`) e em `src/components/loja/reveal.tsx`.

Para usar em **outro projeto**: copie o bloco "Prompt para colar no Claude Code" de cada efeito abaixo,
troque as cores pela paleta do projeto novo, e cole numa conversa do Claude Code apontando pra pasta
daquele projeto. Cada prompt já vem com o CSS completo — o Claude só precisa adaptar nomes de classe/cores
e aplicar nos componentes certos.

---

## 1. Anel de luz viajante no hover (efeito "neon-card")

**Como fica:** ao passar o mouse num card, banner ou moldura de foto, uma fina borda luminosa gira ao
redor dele, acompanhada de um brilho colorido por trás (box-shadow).

**Onde usei:** cards de produto, moldura da foto do hero, banner grande da "Cesta Memorável", o cartãozinho
de mensagem.

**Prompt para colar no Claude Code:**
> Adicione ao CSS global uma classe `.glow-card` que cria um anel de luz giratório no hover, usando esta
> técnica (masked conic-gradient com `@property` para animar o ângulo suavemente):
>
> ```css
> @property --glow-angle {
>   syntax: "<angle>";
>   initial-value: 0deg;
>   inherits: false;
> }
> .glow-card { position: relative; isolation: isolate; }
> .glow-card::after {
>   content: ""; position: absolute; inset: 0; border-radius: inherit;
>   padding: 1.6px; pointer-events: none; z-index: 6; opacity: 0;
>   background: conic-gradient(from var(--glow-angle),
>     transparent 0deg, COR_1 40deg, COR_2 110deg, COR_3 150deg,
>     transparent 210deg, transparent 360deg);
>   -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
>   -webkit-mask-composite: xor; mask-composite: exclude;
>   transition: opacity .35s ease;
> }
> .glow-card:hover::after { opacity: 1; animation: glow-rotate 2.6s linear infinite; }
> @keyframes glow-rotate { to { --glow-angle: 360deg; } }
> .glow-card:hover {
>   box-shadow: 0 0 0 1px rgba(COR_1_RGB,.16), 0 20px 48px -18px rgba(COR_1_RGB,.35),
>     0 0 28px -8px rgba(COR_2_RGB,.45) !important;
> }
> ```
> Troque COR_1/COR_2/COR_3 pelas cores da marca (ex.: cor primária, cor de destaque, um tom claro de
> apoio). Aplique a classe `glow-card` nos cards de produto, banners e molduras de foto do site.

---

## 2. Brilho passando pelo botão (CTA shimmer)

**Como fica:** uma faixa de luz clara atravessa o botão diagonalmente, em loop, como um reflexo passando.

**Onde usei:** botão "Chamar no WhatsApp" e "Encomendar pelo WhatsApp".

**Prompt para colar no Claude Code:**
> Adicione uma classe `.shine-cta` para os botões principais (CTA), com uma faixa de brilho diagonal que
> atravessa o botão em loop:
>
> ```css
> .shine-cta { position: relative; overflow: hidden; isolation: isolate; }
> .shine-cta::before {
>   content: ""; position: absolute; top: 0; left: 0; width: 45%; height: 100%;
>   background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.4) 50%, transparent 100%);
>   animation: shine-sweep 3.4s ease-in-out infinite; pointer-events: none; z-index: 0;
> }
> .shine-cta > * { position: relative; z-index: 1; }
> @keyframes shine-sweep {
>   0% { transform: translateX(-140%) skewX(-18deg); }
>   100% { transform: translateX(240%) skewX(-18deg); }
> }
> ```
> Aplique em botões de CTA principais (comprar, falar no WhatsApp, assinar).

---

## 3. Borda de luz girando numa seção inteira (efeito "seal"/moldura grande)

**Como fica:** um arco fino e dourado percorre a borda de uma seção inteira (não só um card pequeno),
dando um acabamento de "moldura premium".

**Prompt para colar no Claude Code:**
> Adicione uma classe `.section-glow-border` pra seções inteiras, com um arco de luz girando na borda:
>
> ```css
> @keyframes section-spin {
>   from { transform: translate(-50%, -50%) rotate(0deg); }
>   to   { transform: translate(-50%, -50%) rotate(360deg); }
> }
> .section-glow-border { position: relative; overflow: hidden; padding: 3px; }
> .section-glow-border::before {
>   content: ""; position: absolute; top: 50%; left: 50%; width: 200vmax; height: 200vmax;
>   background: conic-gradient(from 0deg,
>     transparent 0deg 328deg, COR_ESCURA 328deg 334deg, COR_MEDIA 334deg 340deg,
>     COR_CLARA 340deg 347deg, COR_CLARA 347deg 351deg, COR_MEDIA 351deg 355deg,
>     COR_ESCURA 355deg 358deg, transparent 358deg 360deg);
>   animation: section-spin 7s linear infinite; z-index: 0; pointer-events: none;
> }
> .section-glow-border > * { position: relative; z-index: 1; }
> ```
> Use com moderação — no máximo 1 seção por página (ex.: a seção de destaque/prova social).

---

## 4. Revelação suave ao rolar a página (scroll reveal)

**Como fica:** cada seção/card nasce com opacidade 0 e um pouco deslocado pra baixo, e aparece suavemente
conforme o visitante rola até ele — sem esperar a página inteira carregar.

**Onde usei:** em quase todas as seções da home, categoria e página de produto (componente `<Reveal>`).

**Prompt para colar no Claude Code:**
> Crie um componente `Reveal` (client component, se o projeto for Next.js App Router) que envolve
> qualquer seção/card e o revela suavemente quando entra na tela, usando IntersectionObserver.
> Regra importante de robustez: o observer só DESLIGA a animação quando confirma que funcionou — nunca
> comece com o conteúdo escondido sem um plano B, porque há navegadores/ambientes em que o
> IntersectionObserver não dispara (bug real, já visto em produção); nesse caso o conteúdo tem que
> aparecer mesmo assim, não pode ficar invisível pra sempre.
>
> CSS:
> ```css
> .reveal { opacity: 0; transform: translateY(22px);
>   transition: opacity .6s ease, transform .6s cubic-bezier(.2,.7,.2,1); }
> .reveal.in { opacity: 1; transform: none; }
> @media (prefers-reduced-motion: reduce) {
>   .reveal { opacity: 1; transform: none; transition: none; }
> }
> ```
> Componente (React):
> ```tsx
> "use client";
> import { useEffect, useRef, type ReactNode } from "react";
> export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
>   const ref = useRef<HTMLDivElement>(null);
>   useEffect(() => {
>     const el = ref.current;
>     if (!el) return;
>     if (!("IntersectionObserver" in window)) { el.classList.add("in"); return; }
>     const observer = new IntersectionObserver((entries) => {
>       entries.forEach((entry) => {
>         if (entry.isIntersecting) { entry.target.classList.add("in"); observer.unobserve(entry.target); }
>       });
>     }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
>     observer.observe(el);
>     return () => observer.disconnect();
>   }, []);
>   return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
> }
> ```
> Envolva cada seção da página com `<Reveal>...</Reveal>`.

---

## 5. Entrada "estouro" no primeiro carregamento

**Como fica:** ao abrir o site, o herói (foto + texto) nasce com um leve efeito de "pop" — cresce de 92%
pra 100% do tamanho com um pequeno overshoot, em vez de simplesmente aparecer.

**Prompt para colar no Claude Code:**
> Adicione uma classe `.pop-in` pros elementos do topo da página (acima da dobra), com uma entrada tipo
> "estouro" suave ao carregar (sem precisar de scroll/observer, já que estão visíveis de cara):
>
> ```css
> @keyframes pop-in {
>   0% { opacity: 0; transform: scale(.92) translateY(10px); }
>   60% { opacity: 1; transform: scale(1.015) translateY(0); }
>   100% { transform: scale(1); }
> }
> .pop-in { animation: pop-in .7s cubic-bezier(.22,.61,.36,1) both; }
> ```
> Aplique na foto e no texto do hero, com um pequeno `animation-delay` no segundo elemento (ex.: `0.12s`)
> pra um efeito de cascata em vez de tudo entrar junto.

---

## 6. Hover com degradê da marca (em vez de cor chapada)

**Como fica:** ao passar o mouse num link de navegação, em vez de um fundo azul/verde liso, aparece um
degradê sutil nas cores da marca.

**Prompt para colar no Claude Code:**
> Adicione uma classe `.nav-hover-grad` pros links de navegação (menu, rodapé):
> ```css
> .nav-hover-grad { transition: background .15s ease, color .15s ease; }
> .nav-hover-grad:hover {
>   background-color: COR_FUNDO_CLARA;
>   background-image: linear-gradient(115deg, rgba(COR_1_RGB,.16), rgba(COR_2_RGB,.22));
>   color: COR_PRIMARIA;
> }
> ```

---

## 7. Logo animada — luz viajante nos traços (SVG)

**Como fica:** o ícone/logo tem um traço de luz clara correndo continuamente ao longo do desenho, em
loop infinito, com um leve brilho (blur) — funciona como arquivo `.svg` estático, sem precisar de
JavaScript, basta usar `<img src="logo.svg">`.

**Prompt para colar no Claude Code:**
> Crie (ou adapte) o arquivo SVG do logo com esta estrutura: os traços base do desenho ficam sempre
> visíveis com a cor sólida da marca; por cima, uma cópia de cada traço em uma cor clara, com
> `stroke-dasharray` (um segmento curto + um vão grande) e uma tag `<animate>` nativa do SVG que faz o
> `stroke-dashoffset` percorrer o traço inteiro em loop — isso cria o efeito de "cometa de luz" correndo
> pelo desenho. Envolva o grupo animado num `<filter>` com `feGaussianBlur` + `feMerge` pra dar um leve
> brilho.
>
> ```xml
> <defs>
>   <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
>     <feGaussianBlur stdDeviation="1.6" result="b"/>
>     <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
>   </filter>
> </defs>
> <path d="SEU_TRAÇO" stroke="COR_MARCA" stroke-width="5"/> <!-- traço base -->
> <g filter="url(#glow)">
>   <path d="SEU_TRAÇO" stroke="COR_CLARA" stroke-width="3"
>     stroke-dasharray="18 200" stroke-dashoffset="0">
>     <animate attributeName="stroke-dashoffset" values="0;-218" dur="2.6s" repeatCount="indefinite"/>
>   </path>
> </g>
> ```
> O número em `stroke-dasharray` (segmento) + o vão devem somar aproximadamente o comprimento total do
> traço, pra o loop fechar sem "salto" visível — não precisa ser exato, só aproximado. Salve como arquivo
> em `public/` e use com `<img src="/logo.svg" alt="..." />` no cabeçalho do site.

---

## 8. Banner de foto real — nunca cortar, fundo bege, legenda separada

**Como fica:** quando o banner usa uma foto real do cliente (não um mockup), a foto nunca é cortada
(sem `object-fit: cover` forçando recorte), o fundo do card é um bege quente (não branco puro), e a
legenda/CTA fica numa faixa própria abaixo da foto — nunca escrita em cima da imagem com gradiente.

**Prompt para colar no Claude Code:**
> Ao montar um card/banner com foto real (não ilustração), siga esta régua: 1) a foto nunca é cortada —
> `width: 100%; height: auto; display: block`, sem `object-fit`, na proporção nativa do arquivo; 2) o
> fundo do card usa o bege/creme do tema, não branco puro; 3) a legenda ou call-to-action fica num rótulo
> próprio ABAIXO da foto, nunca escrita em cima da imagem com gradiente escuro. Combine com a classe do
> item 1 (`glow-card`) pra dar a moldura com anel de luz no hover.

---

## 9. Interruptor de acessibilidade (obrigatório sempre que usar os efeitos acima)

**Prompt para colar no Claude Code:**
> Adicione este bloco global no CSS, como rede de segurança pra quem tem `prefers-reduced-motion`
> ativado no sistema (evita desconforto/enjoo com animações em loop infinito):
> ```css
> @media (prefers-reduced-motion: reduce) {
>   *, *::before, *::after {
>     animation-duration: 0.001ms !important;
>     animation-iteration-count: 1 !important;
>     transition-duration: 0.001ms !important;
>   }
> }
> ```

---

## Onde cada efeito está aplicado neste projeto (Juliana Present)

| Efeito | Classe | Onde |
|---|---|---|
| Anel de luz no hover | `.jc-glow-card` | `product-card.tsx`, `hero.tsx`, `collections.tsx` (banner Memorável), `cartaozinho-signature.tsx`, `produto/[slug]/page.tsx`, `category-tiles.tsx` |
| Brilho no botão | `.jc-shine-cta` | `whatsapp-cta.tsx`, `produto/[slug]/page.tsx` |
| Revelação ao rolar | `.jc-reveal` + `<Reveal>` | quase todas as seções da home, categoria e produto |
| Entrada "estouro" | `.jc-pop` | `hero.tsx`, `produto/[slug]/page.tsx` |
| Hover com degradê | `.jc-nav-hover` | `site-header.tsx` (links de categoria, ícones conta/carrinho) |
| Logo com luz viajante | — | `public/logo/juliana-present-icon.svg` |

Origem técnica: `apd-clinical-saas/src/index.css` (Agentop), auditado em 2026-09-02. Cores trocadas de
azul/rosa neon pra verde-cerrado/ipê-amarelo — a técnica é a mesma, a paleta é da Juliana Present.
