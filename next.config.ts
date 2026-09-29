import type { NextConfig } from "next";
import path from "node:path";

const SUPABASE = "https://oygizajevizwhiymgsly.supabase.co";
const GA = "https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com";

// CSP: enforçada na vitrine, em modo relatório no painel (só avisa no console). 'unsafe-inline' porque o Next
// injeta scripts/estilos inline; nonce fica para uma próxima etapa.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE} ${GA}`,
  `media-src 'self' blob: ${SUPABASE}`,
  `connect-src 'self' ${SUPABASE} ${GA}`,
  "font-src 'self' data:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self' https://wa.me https://api.whatsapp.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // Silencia o aviso do Turbopack: ha um package-lock.json solto em Downloads
  // (pasta pai, com varios projetos) que o Next tenta descartar como workspace root.
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    // Default de 1mb e pouco pra foto de banner/produto/video (upload vira
    // Server Action com FormData) -- video de produto vai ate 20mb.
    serverActions: {
      bodySizeLimit: "24mb",
    },
  },
  images: {
    // 29/09/2026: a cota do otimizador da Vercel acabou (402). As fotos do Storage
    // passam por /api/img (sharp + cache imutável na CDN), que gera cada largura
    // uma vez. Para voltar ao otimizador da Vercel: remover loaderFile.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    // Sem isso, TODA imagem vinda do Storage do Supabase (logo, favicon, foto
    // de produto/banner enviada pelo painel) volta 400
    // INVALID_IMAGE_OPTIMIZE_REQUEST do /_next/image e aparece quebrada na
    // tela -- foi exatamente o que aconteceu com o favicon em 03/09/2026.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oygizajevizwhiymgsly.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
      // Vitrine: CSP ENFORÇADA (telas conferidas sem violação em 29/09/2026).
      {
        source: "/((?!admin|super|plataforma|auth).*)",
        headers: [{ key: "Content-Security-Policy", value: CSP }],
      },
      // Painel/plataforma: continua só em relatório até conferir cada tela.
      {
        source: "/(admin|super|plataforma|auth)/:path*",
        headers: [{ key: "Content-Security-Policy-Report-Only", value: CSP }],
      },
    ];
  },
};

export default nextConfig;
