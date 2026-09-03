// Fontes disponíveis pro texto dos banners -- os mesmos valores de CSS
// var() usados tanto no preview do admin quanto no carrossel real da home.
export const BANNER_FONTS = [
  { value: "display", label: "Título (Young Serif)", cssVar: "var(--font-young-serif)" },
  { value: "sans", label: "Texto (Figtree)", cssVar: "var(--font-figtree)" },
  { value: "playfair", label: "Elegante (Playfair Display)", cssVar: "var(--font-playfair)" },
  { value: "poppins", label: "Amigável (Poppins)", cssVar: "var(--font-poppins)" },
] as const;

export type BannerFontValue = (typeof BANNER_FONTS)[number]["value"];

export function bannerFontCssVar(value: string): string {
  return BANNER_FONTS.find((f) => f.value === value)?.cssVar ?? BANNER_FONTS[0].cssVar;
}
