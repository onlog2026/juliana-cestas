import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireStaffWithModule } from "@/lib/auth/require-module";
import { getContentForAdmin } from "@/modules/content/service";
import { ContentListForm } from "@/components/admin/content-list-form";
import { ContentFieldsForm } from "@/components/admin/content-fields-form";

export const metadata = { title: "Textos do site" };

const ICON_OPTIONS = ["PenLine", "ShieldCheck", "Truck", "Headset", "Gift", "Clock", "Heart", "Star"] as const;

export default async function AdminTextosPage() {
  // TRAVA DE SERVIDOR: esconder o item do menu não impede ninguém de
  // digitar este endereço na barra do navegador. Quem chega aqui sem o
  // módulo "cms" no plano é levado para a página de oferta.
  // (Esta tela edita os textos do site.)
  const staff = await requireStaffWithModule("cms");
  const t = staff.tenantId;

  const [benefits, faq, signature, whatsappCta, categoryTiles, collections, about, returns, business] =
    await Promise.all([
      getContentForAdmin(t, "benefits"),
      getContentForAdmin(t, "faq"),
      getContentForAdmin(t, "signature"),
      getContentForAdmin(t, "whatsapp_cta"),
      getContentForAdmin(t, "category_tiles"),
      getContentForAdmin(t, "collections"),
      getContentForAdmin(t, "about"),
      getContentForAdmin(t, "returns"),
      getContentForAdmin(t, "business"),
    ]);

  return (
    <div className="max-w-[1400px]">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin/cms" className="hover:text-primary">
          CMS
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Textos do site</span>
      </nav>

      <h1 className="mt-2 font-display text-2xl text-foreground">Textos do site</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tudo que está escrito nas páginas da loja. O que você não editar aqui continua no texto padrão.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-card border border-border bg-card p-5">
          <h2 className="font-display text-lg text-foreground">Benefícios</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A faixa com os quatro destaques que aparece na home e na página Sobre.
          </p>
          <div className="mt-4">
            <ContentListForm
              section="benefits"
              itemsKey="items"
              items={benefits.value.items as unknown as Record<string, string>[]}
              isCustom={benefits.isCustom}
              itemLabel="Benefício"
              maxItems={8}
              fields={[
                { key: "title", label: "Título", type: "text", placeholder: "Ex: Feita à mão" },
                { key: "description", label: "Descrição", type: "text", placeholder: "Uma frase curta" },
                { key: "icon", label: "Ícone", type: "select", options: ICON_OPTIONS },
              ]}
            />
          </div>
        </section>

        <section className="rounded-card border border-border bg-card p-5">
          <h2 className="font-display text-lg text-foreground">Perguntas frequentes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Aparecem na home, na página de categoria e na página /faq.
          </p>
          <div className="mt-4">
            <ContentListForm
              section="faq"
              itemsKey="items"
              titleLabel="Título da seção"
              title={faq.value.title ?? ""}
              items={faq.value.items as unknown as Record<string, string>[]}
              isCustom={faq.isCustom}
              itemLabel="Pergunta"
              maxItems={20}
              fields={[
                { key: "question", label: "Pergunta", type: "text" },
                { key: "answer", label: "Resposta", type: "textarea" },
              ]}
            />
          </div>
        </section>

        <section className="rounded-card border border-border bg-card p-5">
          <h2 className="font-display text-lg text-foreground">Bloco do cartãozinho</h2>
          <div className="mt-4">
            <ContentFieldsForm
              section="signature"
              value={signature.value as unknown as Record<string, unknown>}
              isCustom={signature.isCustom}
              fields={[
                { key: "title", label: "Título", type: "text" },
                { key: "body", label: "Texto", type: "textarea" },
                { key: "eyebrow", label: "Chapéu (linha pequena acima do título)", type: "text" },
                { key: "imageUrl", label: "Imagem (opcional)", type: "text" },
              ]}
            />
          </div>
        </section>

        <section className="rounded-card border border-border bg-card p-5">
          <h2 className="font-display text-lg text-foreground">Chamada do WhatsApp</h2>
          <div className="mt-4">
            <ContentFieldsForm
              section="whatsapp_cta"
              value={whatsappCta.value as unknown as Record<string, unknown>}
              isCustom={whatsappCta.isCustom}
              fields={[
                { key: "title", label: "Título", type: "text" },
                { key: "body", label: "Texto", type: "textarea" },
                { key: "buttonLabel", label: "Texto do botão", type: "text" },
              ]}
            />
          </div>
        </section>

        <section className="rounded-card border border-border bg-card p-5">
          <h2 className="font-display text-lg text-foreground">Títulos de seção da home</h2>
          <div className="mt-4 space-y-6">
            <ContentFieldsForm
              section="category_tiles"
              value={categoryTiles.value as unknown as Record<string, unknown>}
              isCustom={categoryTiles.isCustom}
              help="Título da faixa de produtos da home."
              fields={[{ key: "title", label: "Título", type: "text" }]}
            />
            <div className="border-t border-border pt-6">
              <ContentFieldsForm
                section="collections"
                value={collections.value as unknown as Record<string, unknown>}
                isCustom={collections.isCustom}
                help="Vitrine por faixa de preço. Deixe o valor em branco para esconder a seção."
                fields={[
                  { key: "title", label: "Título", type: "text" },
                  { key: "maxPriceCents", label: "Preço máximo em centavos (20000 = R$ 200)", type: "text" },
                  { key: "highlightProductSlug", label: "Produto em destaque (slug)", type: "text" },
                ]}
              />
            </div>
          </div>
        </section>

        <section className="rounded-card border border-border bg-card p-5">
          <h2 className="font-display text-lg text-foreground">Página &ldquo;Sobre&rdquo;</h2>
          <div className="mt-4">
            <ContentListForm
              section="about"
              itemsKey="blocks"
              titleLabel="Título da página"
              title={about.value.title}
              items={about.value.blocks as unknown as Record<string, string>[]}
              isCustom={about.isCustom}
              itemLabel="Parágrafo"
              maxItems={40}
              fields={[
                { key: "title", label: "Subtítulo (opcional)", type: "text" },
                { key: "text", label: "Texto", type: "textarea" },
              ]}
            />
          </div>
        </section>

        <section className="rounded-card border border-border bg-card p-5">
          <h2 className="font-display text-lg text-foreground">Página &ldquo;Trocas e entregas&rdquo;</h2>
          <div className="mt-4">
            <ContentListForm
              section="returns"
              itemsKey="blocks"
              titleLabel="Título da página"
              title={returns.value.title}
              items={returns.value.blocks as unknown as Record<string, string>[]}
              isCustom={returns.isCustom}
              itemLabel="Regra"
              maxItems={40}
              fields={[
                { key: "title", label: "Subtítulo (opcional)", type: "text" },
                { key: "text", label: "Texto", type: "textarea" },
              ]}
            />
          </div>
        </section>

        <section className="rounded-card border border-border bg-card p-5">
          <h2 className="font-display text-lg text-foreground">Dados do negócio (Google)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O Google usa isto para mostrar sua loja na busca e no mapa.
          </p>
          <div className="mt-4">
            <ContentFieldsForm
              section="business"
              value={business.value as unknown as Record<string, unknown>}
              isCustom={business.isCustom}
              fields={[
                { key: "description", label: "Descrição da loja", type: "textarea" },
                { key: "priceRange", label: "Faixa de preço (ex: R$179 - R$489)", type: "text" },
                { key: "areaServed", label: "Cidade que você atende", type: "text" },
                { key: "opensAt", label: "Abre às", type: "text" },
                { key: "closesAt", label: "Fecha às", type: "text" },
              ]}
              help="Endereço e telefone ficam em Configurações, no perfil da loja."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
