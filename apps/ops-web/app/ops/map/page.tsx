"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { apiFetch } from "../../../lib/api";
import { getToken } from "../../../lib/auth";

type MapOrder = {
  id: string;
  status: string;
  currentEta: number;
  etaDeltaMinutes: number;
  delayReason: string | null;
  delayLevel: "GREEN" | "YELLOW" | "RED";
  courier: { id: string; lat: number; lon: number };
};

type MapResponse = {
  orders: MapOrder[];
  couriers: any[];
  trafficStatus: string;
  lastSnapshotAgeMin: number | null;
};

function colorForLevel(level: MapOrder["delayLevel"]) {
  if (level === "RED") return "#ef4444";
  if (level === "YELLOW") return "#f59e0b";
  return "#22c55e";
}

export default function MapPage() {
  const router = useRouter();
  const [data, setData] = useState<MapResponse | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    apiFetch("/ops/map").then(setData).catch(() => setData(null));
  }, [router]);

  const center = useMemo<[number, number]>(() => {
    if (data?.orders?.length) {
      const first = data.orders[0];
      return [first.courier.lat, first.courier.lon];
    }
    return [41.015, 28.979];
  }, [data]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Live Map</h1>
      {!data && <div className="text-sm text-gray-500">Loading map...</div>}
      {data && (
        <>
          <div className="text-sm mb-4">
            Couriers: {data.couriers.length} | Orders: {data.orders.length}
            <div>
              Traffic: {data.trafficStatus} (age {data.lastSnapshotAgeMin ?? 0}m)
            </div>
          </div>
          <div className="h-[520px] w-full border bg-white">
            <MapContainer center={center} zoom={12} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {data.orders.map((order) => {
                const color = colorForLevel(order.delayLevel);
                return (
                  <CircleMarker
                    key={order.id}
                    center={[order.courier.lat, order.courier.lon]}
                    radius={8}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.9 }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div>Order: {order.id}</div>
                        <div>Courier: {order.courier.id}</div>
                        <div>ETA: {order.currentEta} min</div>
                        <div>Delay: {order.etaDeltaMinutes} min</div>
                        <div>Reason: {order.delayReason || "n/a"}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
          <div className="mt-3 text-xs text-gray-600 flex gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> On-time
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-yellow-500 inline-block" /> Risk
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> Delayed
            </div>
          </div>
        </>
      )}
    </div>
  );
}
