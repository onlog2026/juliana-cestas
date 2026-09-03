// Banners full-width da home. Hoje é um array fixo no código — pensado pra
// ser exatamente a "forma" que uma tabela `banners` (imagem + posição do
// texto em %) teria quando o painel admin existir de verdade (Fase 5).
// Ver docs/BANNERS-HOME.md.

export type Banner = {
  id: string;
  image: string;
  imageMobile?: string;
  /** CSS object-position — qual parte da foto fica visível no quadro. */
  objectPosition?: string;
  href: string;
  text: string;
  /** Posição do texto em % do quadro (like Agentop's hero.pos.texto). */
  textPosition: { top: number; left: number; maxWidth: number };
  textAlign?: "left" | "center" | "right";
  /** false = guardado pra usar depois (ex.: banner sazonal fora de época). */
  active: boolean;
};

export const banners: Banner[] = [
  {
    id: "cesta-completa",
    image: "/images/banners/banner-cesta-completa.webp",
    objectPosition: "62% 45%",
    href: "/categoria/cafe-da-manha",
    text: "Detalhes que encantam, sabores que emocionam, amor que se celebra.",
    textPosition: { top: 78, left: 6, maxWidth: 92 },
    textAlign: "left",
    active: true,
  },
  {
    id: "mesa-manha",
    image: "/images/banners/banner-mesa-manha.webp",
    objectPosition: "40% 50%",
    href: "/categoria/cafe-da-manha",
    text: "Cestas de café da manhã, montadas à mão em Brasília.",
    textPosition: { top: 40, left: 6, maxWidth: 40 },
    textAlign: "left",
    active: true,
  },
  {
    id: "ingredientes",
    image: "/images/banners/banner-ingredientes.webp",
    objectPosition: "45% 50%",
    href: "/categoria/cafe-da-manha",
    text: "Presentes que surpreendem, feitos à mão por encomenda.",
    textPosition: { top: 10, left: 6, maxWidth: 42 },
    textAlign: "left",
    active: true,
  },
  {
    id: "vitrine",
    image: "/images/banners/banner-vitrine.webp",
    objectPosition: "50% 45%",
    href: "/categoria/cafe-da-manha",
    text: "Presente pra quem você ama, entregue em Brasília.",
    textPosition: { top: 40, left: 60, maxWidth: 36 },
    textAlign: "left",
    active: true,
  },
  {
    id: "lifestyle",
    image: "/images/banners/banner-lifestyle.webp",
    objectPosition: "50% 40%",
    href: "/categoria/cafe-da-manha",
    text: "Momentos gostosos começam com a cesta certa.",
    textPosition: { top: 8, left: 6, maxWidth: 44 },
    textAlign: "left",
    active: true,
  },
  {
    // Sazonal — imagem tem "Feliz Dia das Mães" impresso na própria foto.
    // Fica desligado (active: false) fora da época pra não mostrar uma
    // campanha errada; reative perto do Dia das Mães (2º domingo de maio).
    id: "dia-das-maes",
    image: "/images/banners/banner-dia-das-maes.webp",
    objectPosition: "50% 50%",
    href: "/categoria/cafe-da-manha",
    text: "Um presente especial pro Dia das Mães.",
    textPosition: { top: 78, left: 6, maxWidth: 50 },
    textAlign: "left",
    active: false,
  },
];

export const activeBanners = banners.filter((banner) => banner.active);
