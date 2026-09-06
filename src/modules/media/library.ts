import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GALERIA — a biblioteca de fotos e vídeos da loja.
 *
 * Este arquivo é só leitura (as ações ficam em `library-actions.ts`), e a parte
 * que realmente importa dele é `ondeAImagemEstaSendoUsada`.
 *
 * Por que essa checagem existe: apagar da galeria uma foto que está no ar não
 * dá erro nenhum. A linha some do painel, e o site continua apontando para um
 * arquivo que não existe mais -- quem descobre é a cliente, no celular, olhando
 * um quadrado cinza no lugar da cesta. Antes de apagar, a tela tem que dizer
 * onde aquela imagem está.
 *
 * E, quando não dá para conferir tudo, a tela diz O QUE NÃO FOI CONFERIDO em
 * vez de dar um "pode apagar" que não se sustenta.
 */

export type MediaItem = {
  id: string;
  kind: "imagem" | "video";
  url: string;
  thumbUrl: string | null;
  title: string | null;
  alt: string | null;
  sizeBytes: number | null;
  createdAt: string | null;
};

export type UsoDaMidia = {
  /** Onde a imagem foi encontrada, em português: "Produto: Cesta Carinho". */
  usos: string[];
  /**
   * Lugares que NÃO foram conferidos. Nunca fica vazio por acaso: é a lista
   * honesta do que esta função não sabe olhar.
   */
  naoVerificados: string[];
};

const NAO_VERIFICADOS = [
  "Textos e blocos do site montados no CMS (a imagem pode estar dentro de um bloco)",
  "Mensagens de e-mail e conteúdos escritos à mão que citem o endereço da imagem",
];

type MediaRow = {
  id: string;
  kind: string;
  url: string;
  thumb_url: string | null;
  title: string | null;
  alt: string | null;
  size_bytes: number | null;
  created_at: string | null;
};

function mapItem(row: MediaRow): MediaItem {
  return {
    id: row.id,
    kind: row.kind === "video" ? "video" : "imagem",
    url: row.url,
    thumbUrl: row.thumb_url,
    title: row.title,
    alt: row.alt,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

/** Tudo que a loja já enviou, mais novo primeiro. */
export async function listMediaLibrary(tenantId: string): Promise<MediaItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("media_library")
    .select("id, kind, url, thumb_url, title, alt, size_bytes, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[galeria] falha ao listar a biblioteca:", error);
    return [];
  }
  return (data ?? []).map((r) => mapItem(r as MediaRow));
}

/** Um item da galeria desta loja, ou `null`. */
export async function getMediaItem(tenantId: string, id: string): Promise<MediaItem | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("media_library")
    .select("id, kind, url, thumb_url, title, alt, size_bytes, created_at")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapItem(data as MediaRow);
}

/**
 * Onde esta imagem/vídeo está sendo usado NESTA loja.
 *
 * Cada consulta é filtrada por `tenant_id`: o endereço de uma imagem é público
 * (o bucket é público), então sem esse filtro daria para descobrir se um
 * arquivo está em uso na loja de outra pessoa.
 */
export async function ondeAImagemEstaSendoUsada(tenantId: string, url: string): Promise<UsoDaMidia> {
  const endereco = (url ?? "").trim();
  if (!endereco) return { usos: [], naoVerificados: NAO_VERIFICADOS };

  const admin = createAdminClient();
  const usos: string[] = [];
  const naoVerificados = [...NAO_VERIFICADOS];

  async function conferir(rotulo: string, executar: () => Promise<string[]>) {
    try {
      const achados = await executar();
      usos.push(...achados);
    } catch (e) {
      console.error(`[galeria] não consegui conferir ${rotulo}:`, e);
      naoVerificados.push(rotulo);
    }
  }

  await conferir("Produtos (foto de capa, fotos extras e vídeo)", async () => {
    const [capa, galeria, video] = await Promise.all([
      admin.from("products").select("name").eq("tenant_id", tenantId).eq("image_url", endereco),
      admin.from("products").select("name").eq("tenant_id", tenantId).contains("gallery_urls", [endereco]),
      admin.from("products").select("name").eq("tenant_id", tenantId).eq("video_url", endereco),
    ]);
    if (capa.error || galeria.error || video.error) throw capa.error ?? galeria.error ?? video.error;
    const nomes = new Set<string>();
    for (const linha of [...(capa.data ?? []), ...(galeria.data ?? []), ...(video.data ?? [])]) {
      nomes.add(`Produto: ${(linha as { name: string }).name}`);
    }
    return [...nomes];
  });

  await conferir("Banners da home", async () => {
    const [desktop, mobile] = await Promise.all([
      admin.from("banners").select("slug, text").eq("tenant_id", tenantId).eq("image_url", endereco),
      admin.from("banners").select("slug, text").eq("tenant_id", tenantId).eq("mobile_image_url", endereco),
    ]);
    if (desktop.error || mobile.error) throw desktop.error ?? mobile.error;
    const nomes = new Set<string>();
    for (const linha of [...(desktop.data ?? []), ...(mobile.data ?? [])]) {
      const row = linha as { slug: string; text: string | null };
      nomes.add(`Banner: ${row.text?.trim() || row.slug}`);
    }
    return [...nomes];
  });

  await conferir("Categorias", async () => {
    const { data, error } = await admin
      .from("categories")
      .select("name")
      .eq("tenant_id", tenantId)
      .eq("image_url", endereco);
    if (error) throw error;
    return (data ?? []).map((l) => `Categoria: ${(l as { name: string }).name}`);
  });

  await conferir("Marcas", async () => {
    const { data, error } = await admin
      .from("brands")
      .select("name")
      .eq("tenant_id", tenantId)
      .eq("logo_url", endereco);
    if (error) throw error;
    return (data ?? []).map((l) => `Marca: ${(l as { name: string }).name}`);
  });

  await conferir("Identidade visual (logo e favicon)", async () => {
    const { data, error } = await admin
      .from("site_settings")
      .select("logo_header_url, logo_footer_url, favicon_url")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return [];
    const row = data as { logo_header_url: string | null; logo_footer_url: string | null; favicon_url: string | null };
    const achados: string[] = [];
    if (row.logo_header_url === endereco) achados.push("Identidade visual: logo do topo");
    if (row.logo_footer_url === endereco) achados.push("Identidade visual: logo do rodapé");
    if (row.favicon_url === endereco) achados.push("Identidade visual: ícone da aba (favicon)");
    return achados;
  });

  return { usos: [...new Set(usos)], naoVerificados };
}

/**
 * O caminho do arquivo dentro do bucket `site-media`, a partir da URL pública.
 * Devolve `null` quando a URL não é deste bucket (arquivo colado de fora) ou
 * quando não está na pasta desta loja -- e aí NÃO se apaga nada do storage.
 */
export function caminhoNoBucket(url: string, tenantId: string): string | null {
  const marcador = "/storage/v1/object/public/site-media/";
  const i = url.indexOf(marcador);
  if (i === -1) return null;
  const caminho = decodeURIComponent(url.slice(i + marcador.length).split("?")[0]);
  if (!caminho.startsWith(`${tenantId}/`)) return null;
  return caminho;
}
