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
};

export default nextConfig;
