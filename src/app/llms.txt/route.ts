import { buildLlmsText, LLMS_HEADERS } from "@/modules/seo/llms";

export const revalidate = 3600;

export async function GET() {
  return new Response(await buildLlmsText(false), { headers: LLMS_HEADERS });
}
