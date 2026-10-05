import { buildLlmsText, LLMS_HEADERS } from "@/modules/seo/llms";
import { buildLlmsPlataforma, tipoDoHostAtual, urlBaseDaPlataforma } from "@/modules/platform/seo-plataforma";

export const revalidate = 3600;

export async function GET() {
  const { tipo, host } = await tipoDoHostAtual();
  if (tipo === "plataforma") {
    return new Response(await buildLlmsPlataforma(true, urlBaseDaPlataforma(host)), { headers: LLMS_HEADERS });
  }
  return new Response(await buildLlmsText(true), { headers: LLMS_HEADERS });
}
