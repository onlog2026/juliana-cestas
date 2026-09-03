import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Silencia o aviso do Turbopack: ha um package-lock.json solto em Downloads
  // (pasta pai, com varios projetos) que o Next tenta descartar como workspace root.
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    // Default de 1mb e pouco pra foto de banner/produto (upload de imagem
    // do admin vira Server Action com FormData).
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
