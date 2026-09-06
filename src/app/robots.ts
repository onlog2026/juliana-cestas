import type { MetadataRoute } from "next";

// TODO F7: a URL pública de cada loja vai vir de `tenant_domains`. Enquanto
// esse mapa não existe, a única fonte é o env da loja legada.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://juliana-cestas-loja.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Motores de busca e assistentes de IA (GPTBot, ClaudeBot,
        // PerplexityBot, Google-Extended etc. seguem o mesmo grupo "*").
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/conta", "/redefinir-senha"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
