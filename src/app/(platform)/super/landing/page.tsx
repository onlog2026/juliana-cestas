import { ExternalLink, TriangleAlert } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getPlatformContentForAdmin } from "@/modules/platform/landing-service";
import { PLATFORM_ICONS } from "@/modules/platform/landing-content";
import { PlatformContentForm } from "@/components/platform/landing/content-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Página da plataforma" };

/**
 * Editor da landing da plataforma (`/plataforma`).
 *
 * REGRA QUE NÃO PODE SER QUEBRADA: só aparece aqui a seção que a página
 * REALMENTE lê. No Agentop o CMS deixava editar 16 seções e só 3 apareciam no
 * site -- o dono editava, via "Conteúdo salvo!", gravava de verdade no banco, e
 * nada mudava na página. Se um dia alguma seção sair de `/plataforma`, ela sai
 * DESTE arquivo no mesmo commit.
 *
 * Cada seção tem UM formulário. Título e lista da mesma seção salvam juntos --
 * salvar grava a seção inteira, então dois formulários se apagariam.
 */
export default async function SuperLandingPage() {
  await requireSuperAdmin();

  // Se a leitura falhar, a tela DIZ que falhou. Editor mostrando o texto padrão
  // sem avisar faria o dono "salvar" por cima do que já existia no banco.
  let dados: Awaited<ReturnType<typeof carregar>> | null = null;
  let erro: string | null = null;
  try {
    dados = await carregar();
  } catch (e) {
    erro = e instanceof Error ? e.message : "Não foi possível carregar o conteúdo.";
  }

  return (
    <div className="max-w-[1400px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Página da plataforma</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Os textos da página pública que apresenta a plataforma para novos lojistas. Tudo que está aqui aparece
            de verdade em <span className="font-medium text-foreground">/plataforma</span> — não existe campo
            decorativo nesta tela.
          </p>
        </div>
        <a
          href="/plataforma"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-accent"
        >
          Ver a página <ExternalLink className="size-4" />
        </a>
      </div>

      {erro || !dados ? (
        <div className="mt-6 rounded-card border border-destructive/40 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <TriangleAlert className="size-4" /> Não foi possível carregar o conteúdo
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Nada foi editado. Recarregue a página; se continuar, o banco está fora do ar.
          </p>
          {erro ? <p className="mt-2 text-xs text-muted-foreground">Detalhe técnico: {erro}</p> : null}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Secao
            titulo="Topo da página (herói)"
            descricao="O primeiro que a pessoa vê. Os botões levam para o cadastro e para os planos."
          >
            <PlatformContentForm
              section="hero"
              value={dados.hero.value as unknown as Record<string, unknown>}
              isCustom={dados.hero.isCustom}
              fields={[
                { key: "eyebrow", label: "Linha pequena acima do título", type: "text" },
                { key: "title", label: "Título", type: "textarea" },
                { key: "subtitle", label: "Texto de apoio", type: "textarea" },
                { key: "primaryLabel", label: "Texto do botão principal", type: "text" },
                {
                  key: "secondaryLabel",
                  label: "Texto do botão secundário",
                  type: "text",
                  help: "Deixe em branco para esconder o segundo botão.",
                },
                { key: "proof", label: "Frase de prova (abaixo dos botões)", type: "textarea" },
              ]}
              list={{
                key: "highlights",
                itemLabel: "Item",
                maxItems: 6,
                fields: [{ key: "text", label: "Texto", type: "text" }],
                help: "Itens do cartão à direita do título (a ilustração da vitrine).",
              }}
            />
          </Secao>

          <Secao
            titulo="Para quem é"
            descricao="A faixa de nichos de loja, logo abaixo do topo."
          >
            <PlatformContentForm
              section="audiences"
              value={dados.audiences.value as unknown as Record<string, unknown>}
              isCustom={dados.audiences.isCustom}
              fields={[
                { key: "title", label: "Título da seção", type: "text" },
                { key: "subtitle", label: "Texto de apoio", type: "textarea" },
              ]}
              list={{
                key: "items",
                itemLabel: "Nicho",
                maxItems: 6,
                fields: [
                  { key: "name", label: "Nome", type: "text", placeholder: "Ex: Floricultura" },
                  { key: "description", label: "Uma linha", type: "text" },
                  { key: "icon", label: "Ícone", type: "select", options: PLATFORM_ICONS },
                ],
                help: "Cabem 4 lado a lado no computador. Com mais de 4, os últimos passam para a linha de baixo.",
              }}
            />
          </Secao>

          <Secao
            titulo="O que você recebe"
            descricao="A grade de recursos. O PRIMEIRO item da lista é desenhado grande, ocupando o dobro do espaço — deixe nele o argumento mais forte."
          >
            <PlatformContentForm
              section="features"
              value={dados.features.value as unknown as Record<string, unknown>}
              isCustom={dados.features.isCustom}
              fields={[
                { key: "title", label: "Título da seção", type: "text" },
                { key: "subtitle", label: "Texto de apoio", type: "textarea" },
              ]}
              list={{
                key: "items",
                itemLabel: "Recurso",
                maxItems: 9,
                fields: [
                  { key: "title", label: "Título", type: "text" },
                  { key: "description", label: "Descrição", type: "textarea" },
                  { key: "icon", label: "Ícone", type: "select", options: PLATFORM_ICONS },
                ],
                help: "O item 1 é o grande. Use as setas para mudar qual recurso ocupa esse lugar.",
              }}
            />
          </Secao>

          <Secao titulo="Como funciona" descricao="Os passos numerados. A numeração vem da ordem da lista.">
            <PlatformContentForm
              section="steps"
              value={dados.steps.value as unknown as Record<string, unknown>}
              isCustom={dados.steps.isCustom}
              fields={[
                { key: "title", label: "Título da seção", type: "text" },
                { key: "subtitle", label: "Texto de apoio", type: "textarea" },
              ]}
              list={{
                key: "items",
                itemLabel: "Passo",
                maxItems: 6,
                fields: [
                  { key: "title", label: "Título do passo", type: "text" },
                  { key: "description", label: "Descrição", type: "textarea" },
                ],
                help: "Não escreva o número no título — ele é desenhado sozinho, pela posição na lista.",
              }}
            />
          </Secao>

          <Secao
            titulo="Abertura dos planos"
            descricao="Só o texto que abre a seção de planos."
          >
            <PlatformContentForm
              section="plans_intro"
              value={dados.plans_intro.value as unknown as Record<string, unknown>}
              isCustom={dados.plans_intro.isCustom}
              help="Os planos em si (nome, preço e o que cada um inclui) NÃO se editam aqui: eles vêm da tabela de planos da plataforma. Preço que se digita em editor de texto é preço que sai errado."
              fields={[
                { key: "title", label: "Título da seção", type: "text" },
                { key: "subtitle", label: "Texto de apoio", type: "textarea" },
                {
                  key: "note",
                  label: "Observação abaixo dos planos",
                  type: "textarea",
                  help: "Ex: condições de cobrança. Deixe em branco para esconder.",
                },
              ]}
            />
          </Secao>

          <Secao titulo="Perguntas frequentes" descricao="O acordeão perto do fim da página.">
            <PlatformContentForm
              section="faq"
              value={dados.faq.value as unknown as Record<string, unknown>}
              isCustom={dados.faq.isCustom}
              fields={[{ key: "title", label: "Título da seção", type: "text" }]}
              list={{
                key: "items",
                itemLabel: "Pergunta",
                maxItems: 20,
                fields: [
                  { key: "question", label: "Pergunta", type: "text" },
                  { key: "answer", label: "Resposta", type: "textarea" },
                ],
              }}
            />
          </Secao>

          <Secao titulo="Chamada final e rodapé" descricao="A faixa escura no fim da página e a linha do rodapé.">
            <PlatformContentForm
              section="closing"
              value={dados.closing.value as unknown as Record<string, unknown>}
              isCustom={dados.closing.isCustom}
              fields={[
                { key: "title", label: "Título", type: "text" },
                { key: "body", label: "Texto", type: "textarea" },
                { key: "buttonLabel", label: "Texto do botão", type: "text" },
                { key: "footerNote", label: "Linha do rodapé", type: "text" },
              ]}
            />
          </Secao>

          <section className="rounded-card border border-border bg-card p-5">
            <h2 className="font-display text-lg text-foreground">Logo e ícone</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A marca da plataforma (que aparece no topo e no rodapé desta página) fica em{" "}
              <a href="/super/marca" className="font-medium text-primary hover:underline">
                Marca da plataforma
              </a>
              .
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

async function carregar() {
  const [hero, audiences, features, steps, plans_intro, faq, closing] = await Promise.all([
    getPlatformContentForAdmin("hero"),
    getPlatformContentForAdmin("audiences"),
    getPlatformContentForAdmin("features"),
    getPlatformContentForAdmin("steps"),
    getPlatformContentForAdmin("plans_intro"),
    getPlatformContentForAdmin("faq"),
    getPlatformContentForAdmin("closing"),
  ]);
  return { hero, audiences, features, steps, plans_intro, faq, closing };
}

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-card p-5">
      <h2 className="font-display text-lg text-foreground">{titulo}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
