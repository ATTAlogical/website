"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { StoreProduct } from "@/data/store";

export type CartItem = {
  product: StoreProduct;
  quantity: number;
};

/**
 * Music arc state — drives ambient audio across the store journey.
 * browse      → empty cart, ambient looping
 * accumulating → items in cart, music gets heavier
 * checkout    → entering payment, music steps back
 * confirmed   → order placed, light and joyful
 */
export type MusicState = "browse" | "accumulating" | "checkout" | "confirmed";

interface CartCtx {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: StoreProduct) => void;
  removeItem: (slug: string) => void;
  updateQty: (slug: string, qty: number) => void;
  clearCart: () => void;
  musicState: MusicState;
  setMusicState: (s: MusicState) => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const CartContext = createContext<CartCtx>({
  items: [],
  itemCount: 0,
  subtotal: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clearCart: () => {},
  musicState: "browse",
  setMusicState: () => {},
  isOpen: false,
  setOpen: () => {},
});

export function useLaugicalCart() {
  return useContext(CartContext);
}

export function LaugicalCartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [musicState, setMusicState] = useState<MusicState>("browse");
  const [isOpen, setOpen] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("laugical-cart");
      if (saved) setItems(JSON.parse(saved));
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("laugical-cart", JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items]);

  // Drive music arc from item count (unless checkout/confirmed overrides it)
  useEffect(() => {
    if (musicState === "checkout" || musicState === "confirmed") return;
    setMusicState(items.length === 0 ? "browse" : "accumulating");
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = useCallback((product: StoreProduct) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.slug === product.slug);
      if (existing) {
        return prev.map((i) =>
          i.product.slug === product.slug
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.product.slug !== slug));
  }, []);

  const updateQty = useCallback((slug: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.product.slug !== slug));
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.product.slug === slug ? { ...i, quantity: qty } : i
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        musicState,
        setMusicState,
        isOpen,
        setOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
