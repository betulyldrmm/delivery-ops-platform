"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../../lib/cart-context";
import { formatPrice } from "../../../lib/format";

export default function SepetPage() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, total, updateQuantity, removeItem } = useCart();

  if (!items.length) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-2">Sepet</h1>
        <div className="text-sm text-gray-500">Sepetiniz boş.</div>
        <Link className="inline-block mt-4 px-4 py-2 bg-black text-white rounded" href="/customer">
          Ürünlere Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">Sepet</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.product_id} className="bg-white border rounded p-3 flex items-center gap-4">
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">{formatPrice(item.unit_price)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="h-8 w-8 border rounded"
                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
              >
                -
              </button>
              <div className="w-8 text-center">{item.quantity}</div>
              <button
                className="h-8 w-8 border rounded"
                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
              >
                +
              </button>
            </div>
            <button
              className="text-sm text-red-600"
              onClick={() => removeItem(item.product_id)}
            >
              Kaldır
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white border rounded p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Ara Toplam</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Teslimat Ücreti</span>
          <span>{formatPrice(deliveryFee)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Toplam</span>
          <span>{formatPrice(total)}</span>
        </div>
        <button
          className="w-full mt-3 px-4 py-2 bg-emerald-600 text-white rounded"
          onClick={() => router.push("/customer/checkout")}
        >
          Ödemeye Geç
        </button>
      </div>
    </div>
  );
}
