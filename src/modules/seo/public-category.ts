/**
 * Categoria de teste/rascunho não vai para sitemap nem para o llms.txt.
 * (O dono deve desativá-la no painel; esta regra é o cinto de segurança.)
 */
export function isPublicCategory(c: { slug: string; name: string }): boolean {
  return !/^(teste|test|rascunho)(-|$)/i.test(c.slug) && !/^(teste|test)\b/i.test(c.name.trim());
}
