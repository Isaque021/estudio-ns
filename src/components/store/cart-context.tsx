"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  stock: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  totalItems: number;
  totalCents: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "barbearia-cart-v1";
const EMPTY_ITEMS: CartItem[] = [];

let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_ITEMS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ITEMS;
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : EMPTY_ITEMS;
  } catch {
    return EMPTY_ITEMS;
  }
}

function getSnapshot(): CartItem[] {
  if (cache === null) cache = readStorage();
  return cache;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY_ITEMS;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function write(next: CartItem[]): void {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Cota excedida ou armazenamento bloqueado — o carrinho segue em memória.
    }
  }
  listeners.forEach((listener) => listener());
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    const current = getSnapshot();
    const existing = current.find((entry) => entry.productId === item.productId);

    if (existing) {
      write(
        current.map((entry) =>
          entry.productId === item.productId
            ? {
                ...entry,
                quantity: Math.min(entry.quantity + quantity, Math.max(item.stock, 1)),
              }
            : entry,
        ),
      );
      return;
    }

    write([...current, { ...item, quantity: Math.min(quantity, Math.max(item.stock, 1)) }]);
  }, []);

  const removeItem = useCallback((productId: string) => {
    write(getSnapshot().filter((entry) => entry.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    write(
      getSnapshot().map((entry) =>
        entry.productId === productId
          ? { ...entry, quantity: Math.max(0, Math.min(quantity, Math.max(entry.stock, 1))) }
          : entry,
      ),
    );
  }, []);

  const clear = useCallback(() => write([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalCents = items.reduce(
      (sum, item) => sum + item.quantity * item.priceCents,
      0,
    );
    return {
      items,
      hydrated,
      totalItems,
      totalCents,
      addItem,
      removeItem,
      setQuantity,
      clear,
    };
  }, [items, hydrated, addItem, removeItem, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart precisa estar dentro de <CartProvider>.");
  }
  return context;
}
