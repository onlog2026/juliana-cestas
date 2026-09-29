/**
 * Eventos de e-commerce (padrão GA4) num ÚNICO ponto. Regras:
 *  - NUNCA quebra o site: se o Google Analytics está desligado (sem NEXT_PUBLIC_GA4_ID),
 *    bloqueado ou ainda não carregou, não faz nada;
 *  - NUNCA envia dado pessoal (sem nome, e-mail, telefone, endereço, CPF): só o que é da
 *    cesta (id, nome, preço, quantidade) e o nº do pedido;
 *  - respeita "Não rastrear" do navegador;
 *  - `trackOnce` evita contar duas vezes (ex.: purchase ao recarregar a página).
 * Arquivo sem `server-only` e sem React: usado por componentes de cliente e testável.
 */

export type TrackItem = { id: string; name: string; price: number; quantity?: number };

type Params = Record<string, unknown>;
type Gtag = (command: "event", name: string, params?: Params) => void;

function gtag(): Gtag | null {
  if (typeof window === "undefined") return null;
  if (navigator.doNotTrack === "1") return null;
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof g === "function" ? g : null;
}

/** Envia o evento se o Google Analytics estiver disponível. Devolve true se enviou. */
export function track(name: string, params: Params = {}): boolean {
  try {
    const g = gtag();
    if (!g) return false;
    g("event", name, params);
    return true;
  } catch {
    return false;
  }
}

/** Como `track`, mas só UMA vez por `key` nesta aba (sessionStorage). Sem storage, envia normalmente. */
export function trackOnce(key: string, name: string, params: Params = {}): boolean {
  try {
    const storageKey = `jc-track:${key}`;
    if (typeof sessionStorage !== "undefined") {
      if (sessionStorage.getItem(storageKey)) return false;
      const sent = track(name, params);
      if (sent) sessionStorage.setItem(storageKey, "1");
      return sent;
    }
  } catch {
    // storage bloqueado: cai no envio simples
  }
  return track(name, params);
}

/** Itens no formato do GA4 (preço em REAIS, sem dado pessoal). */
export function toGaItems(items: TrackItem[]): Params[] {
  return items.map((i) => ({
    item_id: i.id,
    item_name: i.name,
    price: Math.round(i.price * 100) / 100,
    quantity: i.quantity ?? 1,
  }));
}

export function sumValue(items: TrackItem[]): number {
  return Math.round(items.reduce((sum, i) => sum + i.price * (i.quantity ?? 1), 0) * 100) / 100;
}

export const events = {
  /** Filtro da grade (sem dado pessoal): tipo "categoria" ou "preco" + o valor escolhido. */
  filterProducts: (kind: "categoria" | "preco", value: string) => track("filter_products", { filter_kind: kind, filter_value: value }),
  viewItem: (item: TrackItem) =>
    track("view_item", { currency: "BRL", value: item.price, items: toGaItems([item]) }),
  addToCart: (item: TrackItem) =>
    track("add_to_cart", { currency: "BRL", value: item.price, items: toGaItems([item]) }),
  beginCheckout: (items: TrackItem[]) =>
    track("begin_checkout", { currency: "BRL", value: sumValue(items), items: toGaItems(items) }),
  /** Uma vez por pedido (o nº do pedido é a chave). */
  purchase: (orderNumber: string | number, valueReais: number, items: TrackItem[]) =>
    trackOnce(`purchase:${orderNumber}`, "purchase", {
      transaction_id: String(orderNumber),
      currency: "BRL",
      value: Math.round(valueReais * 100) / 100,
      items: toGaItems(items),
    }),
  lead: (source: string) => track("generate_lead", { source }),
  search: (term: string) => track("search", { search_term: term.trim().slice(0, 80) }),
} as const;
