"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  product_id: string;
  name: string;
  unit_price: number;
  image: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  deliveryFee: number;
  subtotal: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "cart_v1";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readCart());
  }, []);

  const deliveryFee = 29.9;

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => (items.length ? subtotal + deliveryFee : 0),
    [items.length, subtotal, deliveryFee]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      deliveryFee,
      subtotal,
      total,
      addItem: (item) => {
        const existing = items.find((i) => i.product_id === item.product_id);
        const next = existing
          ? items.map((i) =>
              i.product_id === item.product_id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          : [...items, { ...item, quantity: 1 }];
        setItems(next);
        writeCart(next);
      },
      updateQuantity: (productId, quantity) => {
        const next = items
          .map((item) =>
            item.product_id === productId ? { ...item, quantity } : item
          )
          .filter((item) => item.quantity > 0);
        setItems(next);
        writeCart(next);
      },
      removeItem: (productId) => {
        const next = items.filter((item) => item.product_id !== productId);
        setItems(next);
        writeCart(next);
      },
      clearCart: () => {
        setItems([]);
        writeCart([]);
      }
    }),
    [items, deliveryFee, subtotal, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
