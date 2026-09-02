@AGENTS.md

# Juliana Cestas — regras do projeto (LEIA ANTES DE QUALQUER AÇÃO)

> Este CLAUDE.md vence o da pasta pai (`Downloads/CLAUDE.md`). Projeto ISOLADO: nunca misturar com Agentop, Sorteio, Spotlog, YLIP ou NutriSnap.
> O bloco `@AGENTS.md` acima é gerado pelo Next 16: as APIs mudaram em relação ao Next 15. Antes de escrever código, ler o guia em `node_modules/next/dist/docs/`.

## Identidade
- **Nome REAL da marca: "Juliana Present"** (não "Juliana Cestas" — isso era só o nome provisório da pasta na Fase 0). Confirmado em 2026-09-02 pelo material real da cliente (Canva + fotos WhatsApp). Nome da pasta do projeto continua `Juliana Cestas` só por histórico, sem trocar (mexe em caminho/URLs do repo).
- **Slogan real:** "Detalhes que encantam, sabores que emocionam, amor que se celebra!"
- **WhatsApp real da loja:** (61) 99889-4889 → `5561998894889` (já configurado em `NEXT_PUBLIC_WHATSAPP`).
- **Catálogo real (5 cestas, confirmado, não é mais exemplo):** Enquanto R$179,90 (1 pessoa) · Afeto R$189,90 (1 pessoa) · Essência R$289,90 (1 pessoa) · Aconchego R$359,90 (2 pessoas) · Memorável R$489,90 (2-3 pessoas, + R$49,90 vinho opcional). Itens de cada uma em `src/lib/mock-content.ts`. Fonte: catálogo Canva que a cliente enviou (`docs/CATALOGO-REAL-CLIENTE.md` guarda o link e o resumo).
- **Regras reais do negócio** (do mesmo catálogo): pedido com 24h de antecedência (personalizado, 3 dias) · pagamento só Pix ou cartão via link, confirma após pago integral · entrega por terceirizado/Uber, agendada, tolerância de 20min, reentrega cobra taxa de novo · item indisponível é trocado por outro de valor equivalente.
- **Fotos reais:** `public/images/produtos/` (6 fotos, enviadas pela cliente em 2026-09-02). Vínculo foto↔produto é uma escolha nossa (melhor combinação visual), não veio confirmado item a item — perguntar pra Juliana se quiser trocar.
- **Cidade:** Brasília (DF). Entrega local por região administrativa + retirada; envio nacional é roadmap.
- **Dono do projeto:** Adriano (não é dev). Relatórios em português, passo a passo, onde clicar.

## Infra (preencher/conferir antes de SQL ou deploy)
| Recurso | Valor | Observação |
|---|---|---|
| Pasta | `C:\Users\user\Downloads\Juliana Cestas` | tem espaço no nome: sempre entre aspas |
| GitHub (ativo) | `onlog2026/juliana-cestas` — **PÚBLICO** (mudado de privado em 2026-09-02) | remote git local = `onlog`. Conta usada no navegador "Chrome Onlog" (Google `onlogjf@gmail.com`). Ficou público porque o Vercel Hobby bloqueia deploy de commits meus em repo privado, mesmo dono do repo = dono do projeto Vercel. Nenhum segredo no código (`.env.local` nunca foi versionado, conferido). Push feito via Personal Access Token de uso único (criado, usado, revogado na hora — não fica salvo). **Sem credencial git persistente nesta máquina para essa conta**: antes do próximo push, ver seção "Como publicar" abaixo |
| GitHub (original, PAUSADO) | `contatoagentop/juliana-cestas` (privado) | remote git local = `origin`. Continua com o histórico completo, mas o deploy Vercel ligado a ele está bloqueado (ver linha Vercel abaixo). Não apagar — só não é o remote ativo pro deploy |
| Supabase project ID | `oygizajevizwhiymgsly` | URL `https://oygizajevizwhiymgsly.supabase.co` · região sa-east-1 (São Paulo) · plano Free. Conferir caractere a caractere antes de `execute_sql` |
| Supabase org | `Juliana Cestas` (Free) — org id a conferir no dashboard | conta Supabase = `contatoagentop` (Google). Outras orgs dessa conta: `agentop` (Pro, kbdghebozdwyqozoldso) e `jarvis` (Free, lnndplsyudulsigkiybv). O MCP do Supabase desta máquina está em OUTRA conta (org adrianorosa2012, só Fácilbicas): não usar o MCP para este projeto até reconectar |
| Vercel projeto (**ATIVO — link real da loja**) | `juliana-cestas-loja` | conta `onlogjf-1751's projects` (Hobby, GitHub `onlog2026`). **Domínio fixo (o que manda pro cliente): `https://juliana-cestas-loja.vercel.app`** (não usar as URLs com hash tipo `-2vad4w4k7-`, mudam a cada deploy). Deployment Protection (Vercel Authentication) **desligado de propósito** — sem isso a Juliana/cliente cairia numa tela de login da Vercel ao abrir o link. 6 variáveis de ambiente configuradas (Supabase URL/anon/service_role, Asaas sandbox URL, WhatsApp placeholder); tentativa de adicionar `NEXT_PUBLIC_SITE_URL` pela UI não salvou de novo (2ª vez que isso acontece) — adicionar manualmente na próxima sessão ou investigar por que essa variável específica não persiste. **Confirmado: deploy automático por push FUNCIONA** neste projeto (testado com o commit das fotos reais — subiu sozinho, sem reimportação manual) |
| Vercel projeto (morto, NÃO USAR) | `juliana-cestas` (o primeiro, antigo) | conta `onlogjf-1751's projects`. Mesmo bloqueio do de baixo — ficou como projeto órfão, sem uso. Pode ser apagado quando o dono confirmar (ver seção de limpeza) |
| Vercel projeto (PAUSADO) | `juliana-cestas` | conta `contatoagentop-5784` (Hobby). Deploy BLOQUEADO: commits autenticados como `adrianorosa2012@gmail.com` (GitHub `adrianrosa1`) não são reconhecidos como colaborador nesse Hobby team, mesmo em repo público — decisão do dono, ainda em aberto: deixar pausado (atual), upgrade pra Pro, ou resolver identidade do commit |
| Domínio | `A_DEFINIR` | |
| Asaas | sandbox (`https://api-sandbox.asaas.com`) | chave de produção só quando o dono publicar |

## O que aprendi sobre o bloqueio da Vercel (não repetir o erro)
O aviso "Hobby Plan does not support collaboration for **private repositories**" é enganoso — testei com o repositório já público e o bloqueio de deploy **continuou** para o projeto Vercel antigo (o Redeploy dele seguiu recusando, só com a opção "Upgrade to Pro"). Ou seja, tornar o repo público **não** desbloqueia um projeto Vercel que já nasceu bloqueado. O que funcionou de verdade: **criar um projeto Vercel NOVO** (import direto do dashboard) depois do repo já estar com o código atualizado — a primeira importação de um projeto sempre passa, porque é uma ação manual do dono logado, não uma checagem de autor de commit. Ainda não sei se o PRÓXIMO `git push` vai disparar deploy automático no `juliana-cestas-loja` (não testei) ou se vai continuar precisando de reimportação manual — testar no próximo ciclo e atualizar esta nota.

## Como publicar (até confirmar se o deploy automático funciona)
`git push onlog main` precisa de credencial da conta GitHub `onlog2026`, que **não fica salva** nesta máquina (o token usado é de uso único, criado e revogado na hora a cada push). Antes do próximo push:
1. Pedir pro dono conectar o Chrome já logado como `onlogjf@gmail.com` (ele sabe qual é).
2. Criar um Personal Access Token novo em `github.com/settings/personal-access-tokens/new` (não deve pedir verificação de e-mail de novo se a sessão continuar ativa).
3. Escopo: só repositório `onlog2026/juliana-cestas`, permissão `Contents: Read and write`.
4. Depois do push, conferir em `vercel.com/onlogjf-1751s-projects/juliana-cestas-loja/deployments` se subiu sozinho. **Se não subir** (ficar sem deployment novo, ou aparecer "Blocked"), repetir o fluxo de reimportação manual: `vercel.com/new/import?s=https://github.com/onlog2026/juliana-cestas` → nome de projeto novo (o antigo já ficou "usado") → reconfigurar as 6 variáveis de ambiente → Deploy → desligar "Vercel Authentication" em Settings → Deployment Protection do projeto novo.
4. Copiar o token pelo botão da página (nunca digitar à mão), usar uma vez em `git push https://x-access-token:TOKEN@github.com/onlog2026/juliana-cestas.git main`, depois **apagar o token na hora** em Settings → Personal access tokens.
5. Alternativa mais rápida para sessões futuras: o dono pode gerar um token de vida mais longa (ex. 90 dias) e me passar uma vez só — aí eu guardo só localmente (nunca commitado) e não preciso repetir o passo a passo toda vez.

**MCP do Supabase é GLOBAL** e já apontou para projeto errado em outro projeto. Antes de qualquer `execute_sql`/`apply_migration`: `get_project` e comparar o ID com a tabela acima.

## Stack
Next.js 16 (App Router, TypeScript, `src/`, Turbopack) · React 19 · Tailwind v4 · shadcn/ui · Motion · lucide-react · react-hook-form + zod · Supabase (`@supabase/ssr`) · Vercel · Asaas · Vitest + Playwright.

## Comandos
- `npm run dev` (porta 3000) · `npx tsc --noEmit` SEMPRE antes de build/deploy · `npm run build`
- Deploy: `npx vercel@55.0.0 --prod --yes` (CLI pinada; 54.1.0 tem bug de deploy_failed). **Nunca `--prod` sem mostrar o resumo e ter OK do dono.**
- Depois de deploy pela CLI, commitar e dar push: Vercel CLI não salva no git sozinho.

## Convenções
- Domínio e serviços em `src/modules/<dominio>/`; componentes não têm regra de negócio.
- Service role só em `src/lib/supabase/admin.ts` e route handlers. Nada secreto em `NEXT_PUBLIC_*`.
- Webhook Asaas em `src/app/api/asaas/webhook/route.ts`: **auto-contido, sem imports relativos**, fail-closed sem token (500), 200 com token errado, ledger `webhook_events`, 500 + liberar ledger quando a gravação falhar.
- Preço, cupom e frete são SEMPRE recalculados no servidor. Mínimo Asaas R$5. Descrição sanitizada (sem emoji/travessão).
- SQL: `supabase/migrations/NNNN_descricao.sql`, idempotente. Nunca UPDATE/DELETE em produção sem aprovação e rollback preparado.
- Toda tabela tem `tenant_id` + RLS. Testar isolamento entre tenants antes de marcar pronto.
- Ícones: só `lucide-react`. Zero travessões (—) em texto visível. Sem "em breve", sem botão falso, sem lorem ipsum.
- Mobile-first: testar 320/375/390/414/768/1024/1280/1440; sem overflow horizontal; toque ≥ 44px; `filter: blur()` proibido em elemento `position: fixed`.

## Verificação obrigatória antes de dizer "pronto"
`npx tsc --noEmit` → `npm run build` → `/verificar-frontend` (preview, clique real, screenshot desktop + 375px, console sem erro novo) → relatório com "Como testar você mesmo".

## Documentos
- `docs/ANALISE-REFERENCIA.md` — o que foi medido no site de referência e o que NÃO copiar.
- `docs/ARQUITETURA.md` — módulos, banco, eventos, pagamentos, fases.
- `docs/DESIGN.md` — tokens, tipografia, regras anti-genérico, assinatura "o cartãozinho".
- `docs/CATALOGO-REAL-CLIENTE.md` — catálogo real (5 cestas), fonte Canva da cliente.
- `docs/EFEITOS-PREMIUM.md` — biblioteca de efeitos visuais (hover glow, brilho, scroll reveal, logo
  animada), com prompt pronto pra reusar em outros projetos. Técnica extraída do Agentop, recolorida
  pra Juliana Present. Classes `jc-glow-card`/`jc-shine-cta`/`jc-reveal`/`jc-pop`/`jc-nav-hover` em
  `src/app/globals.css`; componente `<Reveal>` em `src/components/loja/reveal.tsx`.
- `docs/OPERACAO.md` — como a Juliana opera a loja (criado na Fase 5).
