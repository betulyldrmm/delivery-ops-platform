import type { CartItem } from "./cart-context";

type OrderMeta = {
  items: CartItem[];
  addressLabel?: string;
};

const STORAGE_KEY = "order_meta_v1";

function readAll(): Record<string, OrderMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, OrderMeta>;
    return parsed || {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, OrderMeta>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveOrderMeta(orderId: string, meta: OrderMeta) {
  const all = readAll();
  all[orderId] = meta;
  writeAll(all);
}

export function getOrderMeta(orderId: string) {
  const all = readAll();
  return all[orderId] || null;
}
