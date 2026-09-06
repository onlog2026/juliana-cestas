import { requireStaffWithModule } from "@/lib/auth/require-module";
import { getStoreTheme, getUltimaTroca } from "@/modules/storefront/service";
import { TemplateGallery, type TemplateCard } from "@/components/admin/template-gallery";
import { blockLabel, variantLabel } from "@/storefront/blocks/schemas";
import { TEMPLATES, getTemplate } from "@/storefront/templates/index";
import { fontLabel } from "@/storefront/theme";

export const metadata = { title: "Modelos de loja" };

/**
 * GALERIA DE MODELOS.
 *
 * Esta página monta os dados e entrega prontos para o componente de cliente.
 * Repare no que ela NÃO entrega: nenhum componente, nenhuma função, nenhum
 * ícone. Só texto, número e cor -- passar função de servidor para cliente
 * derruba a página em produção mesmo passando no build, e este projeto já tem
 * a cicatriz (ver `src/lib/modules/registry.ts`).
 */

const CABECALHO: Record<string, string> = {
  classic: "Logo à esquerda, menu e busca ao lado",
  centered: "Logo no meio, sem busca",
  "search-first": "Busca em primeiro lugar, categorias logo abaixo",
};

const RODAPE: Record<string, string> = {
  full: "Rodapé completo, com colunas de links",
  editorial: "Rodapé enxuto, em uma coluna",
  compact: "Rodapé compacto, só o essencial",
};

const PAGINA_DE_PRODUTO: Record<string, string> = {
  "gallery-left": "Fotos à esquerda, compra à direita",
  "gallery-full": "Foto grande ocupando o topo",
  "compact-list": "Ficha compacta, com a lista do que vem dentro",
};

export default async function AdminModelosPage() {
  const staff = await requireStaffWithModule("templates");

  const [tema, ultimaTroca] = await Promise.all([
    getStoreTheme(staff.tenantId),
    getUltimaTroca(staff.tenantId),
  ]);

  const cards: TemplateCard[] = TEMPLATES.map((template) => {
    const home = template.pages["/"];
    return {
      key: template.key,
      name: template.name,
      description: template.description,
      indicadoPara: template.indicadoPara,
      cores: {
        background: template.theme.background ?? "#ffffff",
        foreground: template.theme.foreground ?? "#111111",
        primary: template.theme.primary ?? "#556b2f",
        card: template.theme.card ?? "#ffffff",
        border: template.theme.border ?? "rgba(0,0,0,0.1)",
        gold: template.theme["jc-gold"] ?? "#d9a441",
        radius: template.theme["jc-radius-card"] ?? "0.5rem",
      },
      fontes: `${fontLabel(template.fonts.display)} nos títulos, ${fontLabel(template.fonts.sans)} no texto`,
      cabecalho: CABECALHO[template.layout.header.variant] ?? template.layout.header.variant,
      rodape: RODAPE[template.layout.footer.variant] ?? template.layout.footer.variant,
      paginaDeProduto:
        PAGINA_DE_PRODUTO[template.layout.productPage.variant] ?? template.layout.productPage.variant,
      secoes: (home?.sections ?? []).map((section) => ({
        type: section.type,
        label: blockLabel(section.type),
        variante: variantLabel(section.type, section.variant),
      })),
    };
  });

  const modeloAtual = tema?.templateKey ?? null;
  const nomeAnterior = ultimaTroca?.templateKeyAnterior
    ? (getTemplate(ultimaTroca.templateKeyAnterior)?.name ?? null)
    : null;

  return (
    <div className="max-w-[1400px]">
      <h1 className="font-display text-2xl text-foreground">Modelos de loja</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        Cada modelo é um site diferente: muda quais seções a sua loja tem, em que ordem elas aparecem, e
        como são o cabeçalho, o rodapé e a página de produto. Não é só uma troca de cor.
      </p>

      <div className="mt-6">
        <TemplateGallery
          cards={cards}
          modeloAtual={modeloAtual}
          podeDesfazer={ultimaTroca !== null}
          nomeModeloAnterior={nomeAnterior}
        />
      </div>
    </div>
  );
}
