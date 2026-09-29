import type { NextConfig } from "next";
import path from "node:path";

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
    // 29/09/2026: a Vercel passou a responder 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED)
    // no /_next/image -- a cota de otimização de imagens do plano acabou e as
    // fotos da home apareciam quebradas. Enquanto o plano não é ampliado, as
    // imagens vão direto do arquivo original (já em .webp, ~170 KB cada) e não
    // dependem da cota. Para voltar a otimizar: remover esta linha.
    unoptimized: true,
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
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
