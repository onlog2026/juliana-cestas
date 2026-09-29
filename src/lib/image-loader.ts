/**
 * Loader próprio do next/image. O otimizador da Vercel estourou a cota (402),
 * então as fotos do Storage passam por /api/img (sharp, cache na CDN). Arquivo
 * local (public/) segue direto, sem otimização.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  if (!/^https?:\/\//i.test(src)) return src;
  return `/api/img?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}
