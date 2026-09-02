import "server-only";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

/** 192 bits de aleatoriedade -- vai na URL do pedido, nunca salvo em texto puro. */
export function generatePublicToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyToken(token: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashToken(token), "hex");
  const stored = Buffer.from(storedHash, "hex");
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}
