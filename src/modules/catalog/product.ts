/**
 * Formato de produto usado pela vitrine.
 *
 * Vivia em `src/lib/mock-content.ts` junto com o catálogo de exemplo da
 * primeira loja. O catálogo saiu (todo produto vem do banco desde a Fase A, e
 * o texto do site saiu do código na Fase 2); o tipo ficou, e agora mora no
 * módulo a que pertence.
 */
export type Product = {
  id: string;
  slug: string;
  name: string;
  serves: string;
  size: string;
  price: number;
  items: string[];
  packaging: string;
  image: string;
  /** Capa (image) + galeria extra, nessa ordem -- até 5 fotos no total. */
  images: string[];
  videoUrl?: string;
  badge?: string;
};
