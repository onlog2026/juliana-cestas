import "server-only";
import { z } from "zod";

/**
 * O MOTOR do assistente de IA: recebe o que a lojista digitou sobre UM
 * produto e devolve descrição, SEO e legenda prontos.
 *
 * Decisão importante: chama a API da Anthropic com `fetch` puro, sem o SDK
 * (`@anthropic-ai/sdk`). O pacote não está instalado neste projeto e
 * `package.json` está fora dos arquivos que este módulo pode tocar (outro
 * agente trabalha em paralelo nos mesmos arquivos-base). Uma chamada HTTP para
 * `POST /v1/messages` é a API pública e estável da Anthropic -- não precisa do
 * SDK para funcionar, e isso evita mexer numa dependência do projeto inteiro
 * para um único módulo. Se um dia o SDK for adicionado por outro motivo, esta
 * função pode trocar de implementação sem mudar a assinatura.
 *
 * NUNCA envia nada além do que a própria lojista digitou para ESTE produto:
 * nome, itens, ocasião, tom e a foto (se houver). Nenhuma consulta ao banco
 * acontece aqui -- quem traz os dados é `src/modules/ai/actions.ts`, e só os
 * campos abaixo chegam até a Anthropic.
 */

export type ProductContentInput = {
  nome: string;
  /** O que vem na cesta -- já filtrado e sem linhas vazias. */
  itens: string[];
  /** Ocasião (aniversário, dia das mães, condolências...). Pode vir vazia. */
  ocasiao: string;
  /** Tom desejado (ex.: "caloroso", "elegante", "divertido"). Pode vir vazio. */
  tom: string;
  /** URL pública da foto de capa do produto, se já existir. */
  imageUrl?: string;
};

export type ProductContentOutput = {
  descricaoLonga: string;
  descricaoCurta: string;
  seoTitulo: string;
  seoDescricao: string;
  altTexto: string;
  legendaRedeSocial: string;
};

export type GenerateContentResult =
  | { ok: true; content: ProductContentOutput; tokensUsed: number }
  | { ok: false; error: string };

const OutputSchema = z.object({
  descricaoLonga: z.string().trim().min(1),
  descricaoCurta: z.string().trim().min(1),
  seoTitulo: z.string().trim().min(1),
  seoDescricao: z.string().trim().min(1),
  altTexto: z.string().trim().min(1),
  legendaRedeSocial: z.string().trim().min(1),
});

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/** Modelo padrão: bom em português e barato o bastante para uma cota mensal
 * por loja fazer sentido (o texto de um produto não precisa do modelo mais
 * caro da Anthropic). Troca por `AI_MODEL` sem precisar mexer em código. */
const DEFAULT_MODEL = "claude-sonnet-5";

const MENSAGEM_SEM_CHAVE =
  "O assistente de IA ainda não foi ligado nesta loja. Peça para quem cuida do sistema configurar a chave da IA (variável ANTHROPIC_API_KEY) e tente de novo.";

const MENSAGEM_FALHA_GENERICA =
  "Não foi possível gerar o conteúdo agora. Tente de novo em instantes; se continuar falhando, avise o suporte.";

function getApiKey(): string | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  return key ? key : null;
}

function getModel(): string {
  return process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
}

const SYSTEM_PROMPT = `Você é uma redatora publicitária brasileira, especialista em cestas de presente e e-commerce.
Escreve sempre em português do Brasil, sem erros, num tom natural (nunca robótico ou genérico).
Você recebe o nome de uma cesta, os itens que ela contém, a ocasião e o tom desejado (e às vezes uma foto).
Sua tarefa é devolver SOMENTE um objeto JSON válido, sem markdown, sem \`\`\`, sem texto antes ou depois, com exatamente estas chaves (todos os valores são strings em português do Brasil):

{
  "descricaoLonga": "descrição para a página do produto: 2 a 4 frases persuasivas, mencionando os itens de forma natural (não como lista), sem inventar itens que não foram informados",
  "descricaoCurta": "descrição curta para o card do produto na vitrine, até 140 caracteres",
  "seoTitulo": "título para o Google, até 60 caracteres, com o nome do produto",
  "seoDescricao": "meta descrição para o Google, até 155 caracteres, que convide ao clique",
  "altTexto": "texto alternativo objetivo da foto principal, descrevendo o que aparece nela, para acessibilidade (sem começar com 'imagem de' ou 'foto de')",
  "legendaRedeSocial": "legenda pronta para Instagram/Facebook, com 2 a 3 frases e de 3 a 5 hashtags relevantes ao final"
}

Nunca invente itens, preços ou promessas que não foram informados. Se a ocasião ou o tom não vierem, escolha o que combinar melhor com os itens.`;

function buildUserPrompt(input: ProductContentInput): string {
  const linhas = [
    `Nome da cesta: ${input.nome}`,
    `Itens: ${input.itens.join(", ")}`,
    input.ocasiao ? `Ocasião: ${input.ocasiao}` : null,
    input.tom ? `Tom desejado: ${input.tom}` : null,
  ].filter((l): l is string => Boolean(l));
  return linhas.join("\n");
}

/** Extrai o JSON da resposta mesmo que o modelo escreva algo em volta dele. */
function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const inicio = trimmed.indexOf("{");
    const fim = trimmed.lastIndexOf("}");
    if (inicio === -1 || fim === -1 || fim <= inicio) throw new Error("resposta sem JSON");
    return JSON.parse(trimmed.slice(inicio, fim + 1));
  }
}

function isValidHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export async function generateProductContent(input: ProductContentInput): Promise<GenerateContentResult> {
  const apiKey = getApiKey();
  if (!apiKey) return { ok: false, error: MENSAGEM_SEM_CHAVE };

  const userContent: Array<Record<string, unknown>> = [];
  if (input.imageUrl && isValidHttpUrl(input.imageUrl)) {
    userContent.push({ type: "image", source: { type: "url", url: input.imageUrl } });
  }
  userContent.push({ type: "text", text: buildUserPrompt(input) });

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: getModel(),
        max_tokens: 2048,
        // Conteúdo curto e direto: pensamento estendido só encareceria a
        // chamada sem melhorar o resultado. Cota mensal por loja pede
        // eficiência de custo, não o modelo mais caro.
        thinking: { type: "disabled" },
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });
  } catch (e) {
    console.error("[ai/product-content] falha de rede ao chamar a Anthropic:", e);
    return { ok: false, error: MENSAGEM_FALHA_GENERICA };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (e) {
    console.error("[ai/product-content] resposta da Anthropic não é JSON:", e);
    return { ok: false, error: MENSAGEM_FALHA_GENERICA };
  }

  if (!response.ok) {
    const mensagemApi =
      payload && typeof payload === "object" && "error" in payload && payload.error && typeof payload.error === "object" && "message" in payload.error
        ? String((payload.error as { message: unknown }).message)
        : `HTTP ${response.status}`;
    console.error("[ai/product-content] a Anthropic recusou a chamada:", mensagemApi);
    return { ok: false, error: MENSAGEM_FALHA_GENERICA };
  }

  const message = payload as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
    stop_reason?: string;
  };

  if (message.stop_reason === "refusal") {
    return { ok: false, error: "A IA não conseguiu gerar este conteúdo. Tente descrever os itens de outro jeito." };
  }

  const textBlock = (message.content ?? []).find((b) => b.type === "text");
  if (!textBlock?.text) {
    console.error("[ai/product-content] resposta sem bloco de texto:", message);
    return { ok: false, error: MENSAGEM_FALHA_GENERICA };
  }

  let parsedJson: unknown;
  try {
    parsedJson = extractJsonObject(textBlock.text);
  } catch (e) {
    console.error("[ai/product-content] não consegui ler o JSON devolvido pela IA:", e, textBlock.text);
    return { ok: false, error: MENSAGEM_FALHA_GENERICA };
  }

  const parsed = OutputSchema.safeParse(parsedJson);
  if (!parsed.success) {
    console.error("[ai/product-content] JSON da IA não bateu com o formato esperado:", parsed.error.flatten());
    return { ok: false, error: MENSAGEM_FALHA_GENERICA };
  }

  const tokensUsed = (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0);

  return { ok: true, content: parsed.data, tokensUsed };
}
