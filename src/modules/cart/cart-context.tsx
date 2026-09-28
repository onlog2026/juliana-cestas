"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CART_STORAGE_KEY,
  CART_STORAGE_VERSION,
  type CartBuyer,
  type CartItem,
  type CartItemDisplay,
} from "./types";

const EMPTY_BUYER: CartBuyer = { name: "", email: "", phone: "", cpf: "" };

function makeId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

type GiftSeed = {
  productSlug: string;
  productId?: string | null;
  display: CartItemDisplay;
};

/** Cria um presente novo (cesta) em branco: só o produto; o resto o cliente
 *  preenche no editor da página do carrinho. */
export function createGift(seed: GiftSeed): CartItem {
  return {
    id: makeId(),
    idempotencyKey: makeId(),
    productSlug: seed.productSlug,
    productId: seed.productId ?? null,
    addonSlugs: [],
    upsellSlugs: [],
    recipient: { name: "", phone: "" },
    delivery: {
      type: "delivery",
      cep: "",
      street: "",
      addressNumber: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      deliveryDate: "",
      deliverySlotStart: "",
      feeCents: null,
      zoneName: null,
    },
    card: { template: "", recipient: "", sender: "", message: "" },
    notes: "",
    display: seed.display,
    estimatedCents: null,
  };
}

type CartContextValue = {
  items: CartItem[];
  /** Quantidade de cestas no carrinho (para o contador do ícone). */
  count: number;
  /** true depois de hidratar do localStorage (o 1º render é sempre vazio). */
  ready: boolean;
  addGift: (seed: GiftSeed) => string;
  updateGift: (id: string, next: CartItem) => void;
  removeGift: (id: string) => void;
  clear: () => void;
  buyer: CartBuyer;
  setBuyer: (next: CartBuyer) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [buyer, setBuyer] = useState<CartBuyer>(EMPTY_BUYER);
  const [ready, setReady] = useState(false);

  // Hidrata do localStorage SÓ no cliente. O servidor e o 1º render usam [] para
  // não dar mismatch de hidratação; o contador do ícone aparece após montar.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { v?: number; items?: unknown; buyer?: unknown };
        if (parsed && parsed.v === CART_STORAGE_VERSION) {
          if (Array.isArray(parsed.items)) setItems(parsed.items as CartItem[]);
          if (parsed.buyer && typeof parsed.buyer === "object") {
            setBuyer({ ...EMPTY_BUYER, ...(parsed.buyer as Partial<CartBuyer>) });
          }
        }
      }
    } catch {
      // localStorage bloqueado (aba anônima/sem permissão): começa vazio.
    }
    setReady(true);
  }, []);

  // Persiste a cada mudança -- só depois de hidratar, senão o 1º efeito
  // gravaria [] por cima do que já estava salvo.
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({ v: CART_STORAGE_VERSION, items, buyer })
      );
    } catch {
      // ignora: sem persistência, o carrinho ainda funciona na sessão atual.
    }
  }, [items, buyer, ready]);

  const addGift = useCallback((seed: GiftSeed) => {
    const gift = createGift(seed);
    setItems((cur) => [...cur, gift]);
    return gift.id;
  }, []);

  const updateGift = useCallback((id: string, next: CartItem) => {
    setItems((cur) => cur.map((g) => (g.id === id ? next : g)));
  }, []);

  const removeGift = useCallback((id: string) => {
    setItems((cur) => cur.filter((g) => g.id !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setBuyer(EMPTY_BUYER);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({ items, count: items.length, ready, addGift, updateGift, removeGift, clear, buyer, setBuyer }),
    [items, ready, addGift, updateGift, removeGift, clear, buyer]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>.");
  return ctx;
}
