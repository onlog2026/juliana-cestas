/**
 * Ponte da era "loja única" para a era plataforma.
 *
 * Enquanto só existe a loja da Juliana, este é o tenant que o sistema assume
 * quando o host não identifica nenhuma loja (dev, previews da Vercel, hosts
 * legados). É o MESMO id que estava fixo em `src/lib/tenant.ts` -- a diferença
 * é que agora ele é um *fallback nomeado*, não a única resposta possível.
 *
 * Não some quando a plataforma existir: continua sendo a rede de segurança
 * que mantém `julianacesta.com.br` no ar mesmo se a resolução por banco falhar.
 */
export const LEGACY_TENANT_ID = "a0000000-0000-4000-8000-000000000001";
export const LEGACY_TENANT_SLUG = "juliana-cestas";
