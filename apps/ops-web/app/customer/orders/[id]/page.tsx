"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../lib/api";
import { getOrderMeta } from "../../../../lib/order-storage";
import { connectSocket } from "../../../../lib/socket";
import { formatPrice, formatRelativeTime } from "../../../../lib/format";

type OrderData = {
  id: string;
  status: string;
  currentEta: number;
  etaDeltaMinutes: number;
  createdAt: string;
  refundStatus?: string;
  addressLat?: number;
  addressLon?: number;
};

export default function OrderDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    apiFetch(`/customer/orders/${id}`).then(setOrder);
    apiFetch(`/customer/orders/${id}/tracking`).then(setTracking);
    const socket = connectSocket();
    socket.on("customer.order.tracking.updated", (payload: any) => {
      if (payload.order_id === id) {
        apiFetch(`/customer/orders/${id}/tracking`).then(setTracking);
      }
    });
    socket.on("customer.alerts.new", (payload: any) => {
      if (payload.order_id === id) {
        apiFetch(`/customer/orders/${id}/tracking`).then(setTracking);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    setMeta(getOrderMeta(id));
  }, [id]);

  const steps = ["CREATED", "PREPARING", "READY", "ASSIGNED", "PICKED_UP", "ON_ROUTE", "DELIVERED"];
  const stepLabels: Record<string, string> = {
    CREATED: "Alındı",
    PREPARING: "Hazırlanıyor",
    READY: "Hazır",
    ASSIGNED: "Kurye Atandı",
    PICKED_UP: "Picked up",
    ON_ROUTE: "Yolda",
    DELIVERED: "Teslim Edildi"
  };
  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    return Math.max(0, steps.indexOf(order.status));
  }, [order, steps]);

  async function cancelOrder() {
    await apiFetch(`/customer/orders/${id}/cancel`, { method: "POST" });
    const updated = await apiFetch(`/customer/orders/${id}`);
    setOrder(updated);
  }

  if (!order || !tracking) return <div>Yükleniyor...</div>;

  const canCancel = ["CREATED", "PREPARING"].includes(order.status);
  const alertItems = (tracking.alerts || []).slice(0, 3);

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Sipariş Detayı</h1>
        <div className="text-sm text-gray-500">
          {formatRelativeTime(order.createdAt)} • Tahmini Süre {order.currentEta} dk
        </div>
        {tracking.map?.courierLocation && (
          <a className="text-sm underline text-emerald-700" href="#canli-takip">
            Canlı Takibe Git
          </a>
        )}
      </div>

      <div id="canli-takip" className="bg-white border rounded p-4 space-y-2">
        <div className="font-medium">Durum</div>
        <div className="flex flex-wrap gap-2 text-sm">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`px-3 py-1 rounded ${
                index <= currentStepIndex ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {stepLabels[step]}
            </div>
          ))}
          {order.status === "CANCELLED" && (
            <div className="px-3 py-1 rounded bg-red-100 text-red-700">İptal</div>
          )}
        </div>
      </div>

      <div className="bg-white border rounded p-4 space-y-2">
        <div className="font-medium">Adres</div>
        <div className="text-sm text-gray-600">
          {meta?.addressLabel || "Adres bilgisi mevcut değil"}
        </div>
        {(order.addressLat || order.addressLon) && (
          <div className="text-xs text-gray-500">
            Konum: {order.addressLat?.toFixed(4)}, {order.addressLon?.toFixed(4)}
          </div>
        )}
      </div>

      <div className="bg-white border rounded p-4 space-y-2">
        <div className="font-medium">Ürünler</div>
        {meta?.items?.length ? (
          <div className="space-y-2 text-sm">
            {meta.items.map((item: any) => (
              <div key={item.product_id} className="flex justify-between">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>{formatPrice(item.unit_price * item.quantity)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Ürün detayları mevcut değil.</div>
        )}
      </div>

      <div className="bg-white border rounded p-4 space-y-2">
        <div className="font-medium">Canlı Takip</div>
        <div className="text-sm text-gray-600">
          Kurye Konumu:{" "}
          {tracking.map?.courierLocation
            ? `${tracking.map.courierLocation.lat.toFixed(4)}, ${tracking.map.courierLocation.lon.toFixed(4)}`
            : "Şu an görünmüyor"}
        </div>
        <div className="text-sm text-gray-600">Gecikme: {order.etaDeltaMinutes} dk</div>
        {alertItems.length > 0 && (
          <div className="text-sm text-amber-700 space-y-1">
            {alertItems.map((alert: any) => (
              <div key={alert.id || `${alert.type}-${alert.createdAt}`}>
                {alert.type} ({alert.severity})
              </div>
            ))}
          </div>
        )}
        {tracking.weather && (
          <div className="text-sm text-gray-600">
            Weather: {tracking.weather.payload?.condition || "-"} ({tracking.weather.severity})
          </div>
        )}
        {tracking.traffic && (
          <div className="text-sm text-gray-600">
            Traffic: {tracking.traffic.level} (ETA {tracking.traffic.eta_with_traffic_min ?? "n/a"} min)
          </div>
        )}
        {tracking.trafficUnavailable && (
          <div className="text-xs text-gray-500">
            Trafik verisi geçici olarak yok. Tahmini süre trafik verisi olmadan hesaplanır.
          </div>
        )}
      </div>

      {canCancel && (
        <button className="px-4 py-2 bg-gray-200 rounded" onClick={cancelOrder}>
          Siparişi İptal Et
        </button>
      )}
      {order.refundStatus && (
        <div className="text-sm text-gray-600">İade Durumu: {order.refundStatus}</div>
      )}
    </div>
  );
}
