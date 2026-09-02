# Arquitetura — Juliana Cestas

## Objetivo
Loja que vende sozinha (Pix, cartão, boleto via Asaas), painel que a Juliana opera sem dev, base multi-tenant para virar SaaS.

## Stack
Next.js (App Router, TypeScript, `src/`) · Tailwind v4 · shadcn/ui · Motion · lucide-react · react-hook-form + zod · Supabase (Postgres, Auth, Storage, Realtime) via `@supabase/ssr` · Vercel · Asaas (sandbox → produção) · Resend (adaptador) · Vitest + Playwright.

## Pastas
```
src/app/(loja)/          /, /categoria/[slug], /produto/[slug], /busca, /carrinho, /checkout,
                         /pedido/[numero], /minha-conta/*, /faq, /p/[slug]
src/app/(admin)/admin/   dashboard, produtos, categorias, colecoes, pedidos, clientes, cupons,
                         entregas, banners, paginas, configuracoes, usuarios, auditoria
src/app/api/             asaas/webhook, checkout/*, cep, frete, cron/*
src/modules/<dominio>/   catalog, cart, checkout, orders, payments, shipping, customers, cms,
                         notifications, events, audit, rbac
src/components/ui/       shadcn (customizado)   src/components/loja/   src/components/admin/
src/lib/supabase/        server.ts (cookies), client.ts (browser), admin.ts (service role, só servidor)
supabase/migrations/     NNNN_descricao.sql, idempotentes
tests/unit · tests/e2e
```

## Camadas
Apresentação (app/, components/) → Domínio e serviços (modules/*/service.ts, schemas zod) → Persistência (Supabase, RLS) → Integrações (payments/asaas, email/resend, cep/viacep) → Eventos (outbox `domain_events` + processador em route handler/cron) → Webhooks (asaas).
Regra: componente nunca calcula preço, cupom, frete ou estoque; chama serviço.

## Banco (Fase A) — todas com `tenant_id` e RLS
tenants · profiles · roles · permissions · user_roles · customers · addresses · categories · collections · collection_products · products · product_images · product_variants · product_options (campos de personalização: tipo, obrigatório, limite) · inventory_movements · carts · cart_items · coupons · coupon_redemptions · shipping_zones (faixas de CEP / regiões de Brasília, preço, prazo, grátis acima de) · delivery_slots (data + turno, capacidade) · orders · order_items · order_events (timeline) · payments (`asaas_payment_id` UNIQUE) · webhook_events (`event_id` PK) · reviews · banners · pages · settings · notifications · audit_logs (quem, o quê, antes, depois, IP, origem) · domain_events (outbox).

Papéis RBAC: super_admin, admin, gerente, vendedor, estoque, financeiro, atendimento. Permissões granulares por recurso.ação (`orders.update_status`, `products.delete` ...). Cliente final é `customer` (auth separada do staff por papel, mesmo Supabase Auth).

## Eventos de negócio
OrderCreated · PaymentApproved · PaymentFailed · OrderPrepared · OrderShipped · OrderDelivered · CartAbandoned · CustomerCreated · ReviewCreated · LowStockDetected.
Gravados em `domain_events` na mesma transação da mudança; processador idempotente (`processed_at`) alimenta notificações, e-mail, timeline e, depois, CRM/automações.

## Fluxo do pedido
NOVO → PAGAMENTO PENDENTE → PAGAMENTO APROVADO → EM PREPARAÇÃO → PRONTO PARA ENTREGA → SAIU PARA ENTREGA → ENTREGUE → PÓS-VENDA (CANCELADO / REEMBOLSADO como ramos). Toda transição grava `order_events` com autor e origem (cliente, admin, webhook, cron).

## Pagamentos (portado do Agentop)
- `PaymentProvider` (createCustomer, createCharge, getPixQr, getStatus, cancel, parseWebhook) e `AsaasProvider`.
- Cliente Asaas: `ASAAS_API_URL` sem `/v3`, header `access_token`, resposta lida como texto, logs redigidos (PCI).
- Preço, cupom, frete e total recalculados no servidor a partir do banco. Mínimo R$5. Descrição sanitizada (ASCII + acentos PT).
- Pix: `POST /v3/payments` (billingType PIX, dueDate +1 dia, externalReference = order id) → `GET /v3/payments/{id}/pixQrCode` (QR + copia e cola). Confirmação por Realtime na linha `orders` + polling de reserva `GET /v3/payments/{id}`.
- Cartão: `billingType CREDIT_CARD` com `invoiceUrl` hospedado pelo Asaas (nenhum dado de cartão passa pelo nosso servidor). Boleto: `billingType BOLETO` → `bankSlipUrl`.
- Webhook `/api/asaas/webhook` (auto-contido): sem `ASAAS_WEBHOOK_TOKEN` → 500; token errado → 200 ignorado; ledger `webhook_events` (409 = duplicado → 200); PAYMENT_RECEIVED/CONFIRMED → `payments.status=paid`, `orders.payment_status=paid`, status PAGAMENTO APROVADO, evento PaymentApproved; PAYMENT_OVERDUE/REFUNDED/DELETED/CHARGEBACK → status correspondente; falha ao gravar → apaga linha do ledger e responde 500 para o Asaas reenviar. Só service role.
- Idempotência dupla: `webhook_events.event_id` PK + `payments.asaas_payment_id` UNIQUE.

## Entrega
`shipping_zones` por faixas de CEP (Brasília: Plano Piloto, Águas Claras, Taguatinga, Guará, Lago Sul/Norte, Sudoeste, Noroeste, Ceilândia, Samambaia, etc.) com preço, prazo, valor para frete grátis e turnos disponíveis. Retirada na loja como modalidade. CEP via ViaCEP com cache.

## Segurança
Supabase Auth; RLS por tenant e papel; validação zod em toda entrada; rate limit em checkout/webhook/busca; secrets fora do bundle; auditoria de escrita no admin; CSRF coberto por Server Actions/route handlers com origem verificada; headers de segurança em `next.config`.

## SEO e performance
Metadata API, `sitemap.ts`, `robots.ts`, canonical, Open Graph, JSON-LD (Organization, Product, BreadcrumbList), `next/image`, `next/font`, ISR nas páginas de catálogo, paginação, índices no banco, code splitting por rota.

## Variáveis de ambiente
Ver `.env.example`. Supabase injetado pela integração Vercel ↔ Supabase; Asaas colado pelo dono; nada secreto em `NEXT_PUBLIC_*`.

## Fases
0 Infra → 1 Banco/auth/RBAC/seed → 2 Design system + Home → 3 Catálogo → 4 Carrinho/checkout/pagamento/pedidos/conta → 5 Painel admin essencial → 6 SEO/PWA/testes/publicação. Roadmap B: CRM, Kanban, estoque completo, financeiro, marketing/automações, suporte, avaliações, analytics, LGPD completo, painel da plataforma.
