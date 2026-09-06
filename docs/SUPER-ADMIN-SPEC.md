# Painel da plataforma (super admin) — especificação

> Extraída do super admin do Agentop (`apd-clinical-saas`, `SuperAdminPanel.tsx`, ~4.800 linhas)
> em 2026-09-04 e adaptada para uma plataforma de lojas virtuais. Cada regra abaixo saiu de
> código lido, não de memória. É a base da **Fase 4** do plano de plataforma.

## Antes de construir qualquer aba — as duas fundações

### 1. Trigger de guarda de cobrança em `tenants` (o item mais importante de todos)

No Agentop, `authenticated` tinha UPDATE em todas as colunas de `tenants`. Consequência real:
qualquer dono de loja podia mandar

```
PATCH /rest/v1/tenants { subscription_status: 'active', subscription_plan: 'mega',
                         granted_modules: [...], trial_ends_at: '2099-01-01' }
```

e **todos os portões do backend abriam**. `anon` conseguia inserir tenant já `active`. Um membro
de equipe trocava `owner_email` e virava dono. Nada era auditado.

**Desenho da solução (trigger `BEFORE INSERT OR UPDATE`):**
- `service_role`, SQL direto e super admin passam sem restrição;
- no **INSERT** do cliente: força `trialing`, calcula `trial_ends_at` pela config e **zera** plano,
  bônus, módulos, pendências e ids do gateway;
- no **UPDATE** do cliente: colunas de plano/bônus/módulo/trial **mantêm o valor antigo sem lançar
  erro** (a tela nunca "quebra"); `subscription_status` vindo do cliente só aceita `pending` e
  `canceled` — `active` **vira `pending`** (quem confirma é o webhook); `owner_email` só o dono atual
  troca;
- toda tentativa aparada vira linha em `audit_logs`.

> **Regra:** RLS decide *quais linhas*; o trigger decide *quais colunas*. Sem o segundo,
> "o dono pode editar a própria loja" significa "o dono pode se dar o plano máximo de graça".

### 2. `platform_admins` de verdade (não repetir a fachada)

A aba "Equipe & Acesso" do Agentop **não controla acesso nenhum** — o próprio código admite numa
tarja na tela. O acesso real é uma lista fixa de e-mails no código, duplicada em 3 lugares que já
divergiram (um e-mail era "super admin pela API e cego pela UI/RLS").

Aqui: tabela `platform_admins (email pk, name, role, modules text[], is_active)` lida pelo **login,
pelo backend e pela RLS** — uma fonte, três consumidores.

---

## Abas (o que copiar, adaptar e descartar)

| Aba | Veredito | O que é |
|---|---|---|
| **Dashboard** | ESSENCIAL | 6 cards **clicáveis** que levam à lista já filtrada. MRR = soma do preço real de cada plano ativo, nunca `count × preço fixo` (esse bug mostrou número mentiroso por meses). |
| **Health de ambiente** | ESSENCIAL | Grid de credenciais configuradas/faltando, checado a cada 60s. Devolve só `true/false`, nunca o valor. Adaptar para: Asaas, Supabase, Resend, storage. |
| **Lojas (Sellers)** ⭐ | ESSENCIAL | A aba central. Ver detalhe abaixo. |
| **Planos & Preços** ⭐ | ESSENCIAL | Matriz plano × recurso, célula cicla Incluso → Add-on → Não incluso. Limite por célula ("500 produtos"). Dias de trial e o que o trial libera. |
| **Vouchers** ⭐ | ESSENCIAL | Cortesia com prazo, nominal por loja. Validação 100% no servidor. |
| **Financeiro** | ESSENCIAL | MRR/ARR, extrato, CSV. Modo ESTIMADO **com tarja honesta** quando não há pagamento real. |
| **Erros & Alertas** | ESSENCIAL | Últimos 7 dias + detecção de rajada (5 erros do mesmo módulo em 10 min viram 1 linha crítica + e-mail). |
| **Uso por loja** | ESSENCIAL | Quem está perto do limite (upsell) e quem estourou. |
| **Suporte** | ESSENCIAL | Caixa única, com selo "aguardando sua resposta". |
| **CMS da landing** | ESSENCIAL | Modelo `site_content(surface, section, slot, payload jsonb)` — aguenta seção nova **sem migration**. |
| **Preview da landing** | ESSENCIAL | Iframe em 3 larguras (desktop/tablet/mobile) sem sair do painel. |
| **Branding** | ESSENCIAL | Logo, favicon, imagem de compartilhamento. Aqui deve ser **por loja**, não global. |
| **Trocador de ambiente** | ESSENCIAL | Botão flutuante: Plataforma → Loja → Ver como comprador. Navegação por URL, **sem troca de sessão**. |
| **SEO** | ESSENCIAL | Contador de caracteres que fica vermelho ao estourar. No e-commerce precisa ser por produto e categoria também. |
| **Templates de e-mail** | ESSENCIAL | Mapa de todo e-mail com **ID fixo (TPL-001)** e prévia gerada pela mesma função do sistema. O ID fixo é ouro para trabalhar com dono não-dev. |
| **BI** | ADAPTAR | Trocar os KPIs de SaaS por GMV, ticket médio, pedidos/mês, conversão do checkout. |
| **Afiliados** | ADAPTAR | Mecânica de ledger/resgate se copia inteira. |
| **Blog com IA** | ADAPTAR | Gera rascunho, **humano publica**. Nunca publica sozinho. |
| **Nichos/categorias** | ADAPTAR | Lista base do sistema + extras cadastráveis. |
| **Integrações globais** | ADAPTAR | Padrão "config global com fallback por loja" — ótimo para e-mail e frete. |
| **Equipe & Acesso** | NÃO COPIAR A IMPLEMENTAÇÃO | É fachada (ver fundação 2). |
| **CMS antigo** | DESCARTAR | Dívida técnica: dois CMS coexistindo. |
| **Prospecção** | DESCARTAR | Produto dentro do produto. |

### Aba "Lojas" — o que ela faz de verdade

| Botão | Efeito exato | Confirmação |
|---|---|---|
| **Ativar** | `subscription_status='active'`. Libera acesso **sem criar cobrança** — a tela diz isso | `confirm()` explicando que não recria cobrança |
| **Inativar** | Cancela a assinatura **no Asaas primeiro**; se o gateway falhar, **nada muda no banco**; depois grava `canceled` e zera `asaas_subscription_id` | `confirm()` avisando que a cobrança real para |
| **Bônus** | `bonus_until`, `bonus_plan_slug` (pode ser plano superior), motivo, quem concedeu. **Suprime o robô de expiração de trial** | não (é aditivo) |
| **Estender trial** | `trial_ends_at` | não |
| **Mudar plano** | `subscription_plan`. Limites refletem em tempo real. **Não ajusta o valor cobrado** | não |
| **Entrar na loja** | Navega para o painel daquela loja. Sem troca de token | não |

**Não existe "excluir loja"** — excluir mexeria em dezenas de tabelas sem trava de banco. "Cancelar"
é o toggle seguro e reversível, com uma aba "Inativas" para reencontrar.

**A vigência da assinatura nunca vem de campo gravado** — é consultada ao vivo no gateway ao abrir o
modal, porque campo gravado desatualiza.

**Faltam duas ações que só existem em e-commerce:**
1. Estornar um pedido de cliente final de uma loja;
2. Suspender a **vitrine pública** separadamente do **acesso ao painel** (no Agentop é a mesma coisa;
   numa plataforma de lojas não pode ser).

---

## Armadilhas documentadas (cada uma custou um incidente real)

1. **Preço vindo do navegador.** Se o plano não fosse encontrado, o código caía calado no valor que o
   navegador mandou — dava para assinar o plano máximo por R$ 1,00. **Preço só do banco, resolvido por
   slug; caminho de erro nunca degrada para o input do usuário.**
2. **O `200` que custou o acesso do cliente pago.** O `catch` do webhook devolvia 200; para o gateway
   isso é "processei" e ele não reenvia. Uma falha passageira deixava o cliente **pago e sem acesso,
   para sempre**. Padrão correto: **reserve → processe → confirme, e libere a reserva em toda saída de
   erro** (apagar a linha do ledger antes de qualquer 500).
3. **Fail-closed vs fail-open, cada um no seu lugar.** Webhook sem token configurado → **500 e
   bloqueia** (antes, sem a variável, aceitava payload forjado). Sem service role → recusa. Ledger
   indisponível → **fail-open** ("o caminho do dinheiro não pode parar por causa do ledger"). Leitura
   da lista de recursos do trial falhou → **não libera nada**.
4. **"Tem login?" não é "esse dado é seu?"** O portão só perguntava se havia sessão; os ids vinham
   crus do corpo. Dava para ler dados de clientes pagantes e cancelar assinatura alheia. E se a action
   aceita apelidos de campo (`tenantSlug`/`tenant_slug`/`tenantId`), **o guard tem que ler os mesmos
   apelidos** — mandando só o alias, o guard era pulado.
5. **Gate só no front.** Usuário de empresa inadimplente chamava a API direto e passava. Virou gate
   único antes do switch, fail-closed, HTTP 402. **Mas é allowlist manual — módulo novo nasce sem
   gate.** Faça o inverso: gate por padrão, isenção explícita.
6. **Listas espelhadas divergem, sempre.** Aconteceu 3 vezes (a cortesia de um módulo virou botão
   morto por 2 dias). **Se front, backend e RLS precisam da mesma lista, ela mora no banco.**
7. **Duas unidades de dinheiro na mesma tela** (um campo em centavos, outro em reais). **Centavos em
   tudo, sem exceção.**
8. **`supabase.rpc` e `.update()` não lançam.** Devolvem `{ error }`; o `catch` nunca dispara e a tela
   mente "salvo!". **Sempre `.select()` + checagem de `error` e de linhas afetadas.**
9. **Uma coluna inexistente derruba a consulta inteira** no PostgREST, e `data || []` engole o erro —
   a lista aparece vazia sem ninguém saber por quê. **Nunca engula erro de leitura.**
10. **Modo mock ligado pela ausência de credencial.** Sem chave do gateway, o endpoint devolvia
    sucesso falso. Em produção com variável faltando, "funciona" sem cobrar. **Mock só por flag
    explícita.**
11. **Fachadas.** Quatro botões que não faziam nada (inativar que não cancelava, equipe que não dava
    acesso, CMS que ninguém lia, config nunca lida). **Um controle que não faz nada é pior que não
    existir** — se não der para fazer de verdade, escreva na tela que não está fazendo.
12. **Diversos:** nunca logar corpo de endpoint de pagamento (número de cartão foi parar no log);
    escapar HTML de texto de usuário que vá para e-mail; desbloqueio de ação sensível por **pessoa**,
    não por empresa (computador de balcão herdava o poder); eventos de gateway chegam **fora de
    ordem** (um `OVERDUE` de assinatura já substituída bloqueou cliente em dia).

---

## Achados que mudam decisões de arquitetura (segunda rodada de leitura)

### "Entrar como o cliente vê" não existe — e isso é um buraco de auditoria
A documentação do componente promete três portais (plataforma / loja / ver como comprador). Uma
busca no repositório inteiro mostra que o terceiro **só existe no comentário**. Consequência: o único
jeito de entrar numa loja é **cair no painel com privilégio total**, sem faixa "você está vendo como
X", sem modo somente-leitura e **sem registro de qual loja foi acessada e quando**. Uma edição feita
por engano fica indistinguível de uma edição do próprio lojista.

**Aqui:** os três portais de verdade, e "entrar na loja" **grava uma linha de auditoria**. Numa
plataforma com dinheiro de terceiros, "quem mexeu na loja da Juliana às 3h" precisa ter resposta.

### Duas tabelas de configuração com RLS totalmente aberta
`cms_settings` e `user_roles` estão com `FOR ALL USING (true)` — qualquer usuário logado lê **e
escreve** o CMS global da plataforma e a tabela de papéis. As tabelas mais novas já nascem com
`USING(false)` (só o backend escreve).

**Regra:** toda tabela de configuração da plataforma nasce `USING(false)`. Nunca `USING(true)` "pra
destravar agora".

### O CMS da landing edita 16 seções e só 3 têm efeito
A landing foi reescrita e os blocos antigos ficaram como `{false && (...)}` — 8 ocorrências. O dono
edita hero, preço, FAQ e depoimentos, vê "Conteúdo salvo!", grava de verdade no banco, **e nada muda
na página**.

**Regra:** ao reescrever uma tela, ou reconecta o CMS dela, ou remove a aba do CMS. Deixar as duas
vivas e desligadas é o pior dos três resultados.

### Vender o que o sistema não entrega
Três add-ons cobravam e ficavam "Ativos" sem nenhum ponto do sistema entregar o produto — o próprio
comentário no código chama de *"dinheiro entrando sem entregar produto"*. Um outro cobrava por algo
que já era grátis. E uma funcionalidade estava marcada como inclusa num plano **sem existir no
backend**.

A causa estrutural: o formulário de criar add-on **não tem campo de slug** (gera
`addon-<timestamp>`), mas todo o gate do sistema é por slug conhecido. Ou seja, dá para criar,
publicar na vitrine e cobrar por algo que nenhuma linha de código sabe liberar.

**Regra:** item vendável só pode ser criado pelo painel se o código souber entregá-lo — slug de uma
lista fechada, ou o item nasce invisível até alguém ligar a entrega.

### `limit_value` parece trava e não é
É texto livre de vitrine ("150/mês", "10 GB"). A cota real vive em outra tabela. **Separe desde o
início:** `limit_display` (o que o cliente lê) e `limit_value` (o número que o servidor obedece).

### Configuração de produto morando no navegador
A coluna "liberado no trial" do editor de planos gravava **no `localStorage` do super admin** —
ele marcava, via marcado, e nenhum cliente era afetado. **Configuração de produto nunca mora no
navegador de quem configura.**

### Outros detalhes de banco que custaram tempo lá
- `trial_ends_at` declarado `timestamptz` num arquivo e `text` em outro, com trigger gravando string
  ISO. **Aqui: `timestamptz`, ponto final.**
- `tenants.id` era `text` num arquivo e `uuid` em outro; corrigir exigiu **dropar todas as policies**
  da tabela (não dá para alterar tipo de coluna usada em policy) e recriá-las — 3 tentativas.
- Um trigger de limite de equipe foi criado **desabilitado**: está no banco, parece proteção, não
  protege nada.
- Card de plano mostra "Anual: R$ 1.078,92/mês" porque lê um campo aposentado que guarda o total do
  ano. **Ao aposentar um campo, `grep` por todos os leitores no mesmo commit.**

### O que está certo lá e deve ser copiado
Resolução de preço no servidor · fonte única do preço anual (um só percentual) · gravação
merge-safe em JSONB · cache com invalidação ao salvar · distinção entre "banco vazio" e "falha
transitória" no fallback · e o trigger de guarda de cobrança.

---

## Ordem de construção recomendada

1. **Fundações:** trigger de guarda de cobrança + `platform_admins` real.
2. **Painel mínimo que já vale:** Dashboard clicável · Lojas · Planos & Preços · Config com health.
3. **O que evita ficar cego:** Erros & Alertas · Uso por loja · Financeiro (modo estimado honesto).
4. **O que fecha venda:** Vouchers · Trocador de ambiente · CMS · Branding por loja.
5. **Depois:** Suporte · Templates de e-mail · Afiliados · BI.
