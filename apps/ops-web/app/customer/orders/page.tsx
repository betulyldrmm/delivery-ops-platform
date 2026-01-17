"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { formatRelativeTime } from "../../../lib/format";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    apiFetch("/customer/orders?limit=20").then(setOrders);
  }, []);

  useEffect(() => {
    const success = searchParams.get("success");
    if (success) {
      setToast("Siparişiniz alındı. Teşekkürler!");
      const timer = setTimeout(() => {
        setToast(null);
        router.replace("/customer/orders");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  function statusLabel(status: string) {
    const map: Record<string, string> = {
      CREATED: "Alındı",
      PREPARING: "Hazırlanıyor",
      READY: "Hazır",
      ASSIGNED: "Kurye Atandı",
      ON_ROUTE: "Yolda",
      DELIVERED: "Teslim Edildi",
      CANCELLED: "İptal"
    };
    return map[status] || status;
  }

  function statusClass(status: string) {
    if (status === "DELIVERED") return "bg-emerald-50 text-emerald-700";
    if (status === "CANCELLED") return "bg-red-50 text-red-700";
    if (status === "ON_ROUTE" || status === "ASSIGNED") return "bg-amber-50 text-amber-700";
    return "bg-slate-100 text-slate-700";
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Siparişlerim</h1>
      {toast && (
        <div className="mb-3 rounded bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">
          {toast}
        </div>
      )}
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="bg-white border rounded p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{o.id}</div>
              <span className={`px-2 py-1 rounded text-xs ${statusClass(o.status)}`}>
                {statusLabel(o.status)}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-4">
              <span>Tahmini Süre: {o.currentEta} dk</span>
              <span>Oluşturma: {formatRelativeTime(o.createdAt)}</span>
            </div>
            <Link className="inline-block mt-3 text-sm underline" href={`/customer/orders/${o.id}`}>
              Detay
            </Link>
          </div>
        ))}
        {!orders.length && <div className="text-sm text-gray-500">Henüz sipariş yok.</div>}
      </div>
    </div>
  );
}
