"use client";

import { usePathname } from "next/navigation";

/** Páginas onde os dados da empresa/produto fazem sentido (a home). Nas demais, nada é injetado. */
const CAMINHOS_DA_HOME = new Set(["/", "/inicio", "/plataforma"]);

/**
 * JSON-LD `Organization` + `SoftwareApplication` da plataforma. O texto já vem pronto e escapado do servidor
 * (`serializeJsonLd`); aqui só decide em que caminho aparece, para o layout não precisar ler headers.
 */
export function JsonLdPlataforma({ json }: { json: string }) {
  const pathname = usePathname();
  if (!CAMINHOS_DA_HOME.has(pathname ?? "")) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
