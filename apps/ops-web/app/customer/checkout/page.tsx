"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "../../../lib/api";
import { useCart } from "../../../lib/cart-context";
import { formatPrice } from "../../../lib/format";
import { saveOrderMeta } from "../../../lib/order-storage";

type Address = {
  id: string;
  label: string;
  line1?: string;
  city?: string;
  district?: string;
  lat: number;
  lon: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    apiFetch("/customer/addresses")
      .then(async (list) => {
        if (list.length) {
          setAddresses(list);
          setAddressId(list[0].id);
          return;
        }
        const addr = await apiFetch("/customer/addresses", {
          method: "POST",
          body: JSON.stringify({ label: "Ev", city: "İstanbul", district: "Kadıköy", lat: 40.99, lon: 29.03 })
        });
        setAddresses([addr]);
        setAddressId(addr.id);
      })
      .catch(() => {
        setToast({ type: "error", message: "Adresler yüklenemedi." });
      });
  }, []);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === addressId),
    [addresses, addressId]
  );

  async function confirmOrder() {
    if (!items.length) {
      setToast({ type: "error", message: "Sepetiniz boş." });
      return;
    }
    if (!addressId) {
      setToast({ type: "error", message: "Adres seçiniz." });
      return;
    }
    setLoading(true);
    try {
      const order = await apiFetch("/customer/orders", {
        method: "POST",
        body: JSON.stringify({
          address_id: addressId,
          payment_method: paymentMethod,
          items: items.map((item) => ({
            product_id: item.product_id,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price
          }))
        })
      });
      saveOrderMeta(order.id, {
        items,
        addressLabel: selectedAddress?.label
      });
      clearCart();
      router.push("/customer/orders?success=1");
    } catch (err) {
      if (err instanceof ApiError) {
        console.error("Sipariş hatası:", err.status, err.body);
      } else {
        console.error("Sipariş hatası:", err);
      }
      setToast({
        type: "error",
        message: "Sipariş oluşturulamadı. Lütfen tekrar deneyin."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold mb-2">Ödeme</h1>
        <p className="text-sm text-gray-500">Adres ve ödeme bilgilerinizi kontrol edin.</p>
      </div>

      {toast && (
        <div
          className={`rounded px-3 py-2 text-sm ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="bg-white border rounded p-4 space-y-3">
        <div className="font-medium">Teslimat Adresi</div>
        {addresses.length === 0 && <div className="text-sm text-gray-500">Yükleniyor...</div>}
        {addresses.map((addr) => (
          <label key={addr.id} className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              name="address"
              checked={addressId === addr.id}
              onChange={() => setAddressId(addr.id)}
            />
            <div>
              <div className="font-medium">{addr.label}</div>
              <div className="text-gray-500">
                {addr.district || "-"} / {addr.city || "-"}
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="bg-white border rounded p-4 space-y-3">
        <div className="font-medium">Ödeme Yöntemi</div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === "card"}
            onChange={() => setPaymentMethod("card")}
          />
          Kart
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === "cash"}
            onChange={() => setPaymentMethod("cash")}
          />
          Kapıda
        </label>
      </div>

      <div className="bg-white border rounded p-4 space-y-2">
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
          className="w-full mt-3 px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-50"
          onClick={confirmOrder}
          disabled={loading || !items.length}
        >
          {loading ? "İşleniyor..." : "Siparişi Onayla"}
        </button>
      </div>
    </div>
  );
}
