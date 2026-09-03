import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Limite de taxa por chave (ex: "create-order:1.2.3.4"), usando a função
 * rl_hit já criada no banco (0004_orders.sql). Falha aberta (não bloqueia)
 * se a checagem em si der erro -- rate limit nunca pode derrubar o site.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("rl_hit", { p_key: key, p_window_seconds: windowSeconds });
    if (error) return true;
    return (data as number) <= limit;
  } catch {
    return true;
  }
}
