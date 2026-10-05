import type { MetadataRoute } from "next";
import { getTenantId } from "@/lib/tenant/context";
import { getSiteUrlOrFallback } from "@/lib/tenant/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const SITE_URL = await getSiteUrlOrFallback(await getTenantId());
  return {
    rules: [
      {
        // Motores de busca e assistentes de IA (GPTBot, ClaudeBot,
        // PerplexityBot, Google-Extended etc. seguem o mesmo grupo "*").
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/conta", "/carrinho", "/checkout", "/pedido", "/avaliar", "/redefinir-senha"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
