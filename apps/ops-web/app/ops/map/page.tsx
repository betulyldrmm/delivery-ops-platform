"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
  pickup: { lat: number; lon: number } | null;
  dropoff: { lat: number; lon: number } | null;
  courier: { id: string; lat: number; lon: number } | null;
};

type MapCourier = {
  id: string;
  lat: number;
  lon: number;
  isAvailable?: boolean;
  status?: string;
  lastLocationAt?: string;
};

type MapResponse = {
  orders: MapOrder[];
  couriers: MapCourier[];
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
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const payload = await apiFetch("/ops/map");
      setData(payload);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    load();
    const timer = setInterval(load, 20000);
    return () => clearInterval(timer);
  }, [router]);

  const center = useMemo<[number, number]>(() => {
    if (data?.orders?.length) {
      const withDropoff = data.orders.find((order) => order.dropoff);
      if (withDropoff?.dropoff) return [withDropoff.dropoff.lat, withDropoff.dropoff.lon];
      const withPickup = data.orders.find((order) => order.pickup);
      if (withPickup?.pickup) return [withPickup.pickup.lat, withPickup.pickup.lon];
    }
    const courier = data?.couriers?.find((c) => Number.isFinite(c.lat) && Number.isFinite(c.lon));
    if (courier) return [courier.lat, courier.lon];
    return [41.015, 28.979];
  }, [data]);

  const warnings = useMemo(() => {
    if (!data) return [];
    const missingPickup = data.orders.filter((order) => !order.pickup).length;
    const missingDropoff = data.orders.filter((order) => !order.dropoff).length;
    const items: string[] = [];
    if (missingPickup) items.push(`${missingPickup} orders missing pickup coords`);
    if (missingDropoff) items.push(`${missingDropoff} orders missing dropoff coords`);
    return items;
  }, [data]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Live Map</h1>
      {!data && <div className="text-sm text-gray-500">Loading map...</div>}
      {data && (
        <>
          <div className="text-sm mb-4 flex flex-wrap items-center gap-4">
            <div>
              Couriers: {data.couriers.length} | Orders: {data.orders.length}
            </div>
            <div>
              Traffic: {data.trafficStatus} (age {data.lastSnapshotAgeMin ?? 0}m)
            </div>
            <button className="px-2 py-1 bg-black text-white" onClick={load} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {warnings.length > 0 && (
            <div className="mb-3 text-xs text-amber-700">
              {warnings.map((warning) => (
                <div key={warning}>{warning}</div>
              ))}
            </div>
          )}
          <div className="h-[520px] w-full border bg-white">
            <MapContainer center={center} zoom={12} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {data.orders.map((order) => {
                const color = colorForLevel(order.delayLevel);
                return (
                  <Fragment key={order.id}>
                    {order.pickup && (
                      <CircleMarker
                        key={`${order.id}-pickup`}
                        center={[order.pickup.lat, order.pickup.lon]}
                        radius={6}
                        pathOptions={{ color: "#f97316", fillColor: "#f97316", fillOpacity: 0.9 }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <div>Order: {order.id}</div>
                            <div>Pickup</div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    )}
                    {order.dropoff && (
                      <CircleMarker
                        key={`${order.id}-dropoff`}
                        center={[order.dropoff.lat, order.dropoff.lon]}
                        radius={8}
                        pathOptions={{ color, fillColor: color, fillOpacity: 0.9 }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <div>Order: {order.id}</div>
                            <div>Status: {order.status}</div>
                            <div>ETA: {order.currentEta} min</div>
                            <div>Delay: {order.etaDeltaMinutes} min</div>
                            <div>Reason: {order.delayReason || "n/a"}</div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    )}
                  </Fragment>
                );
              })}
              {data.couriers.map((courier) => (
                <CircleMarker
                  key={`courier-${courier.id}`}
                  center={[courier.lat, courier.lon]}
                  radius={6}
                  pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.9 }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div>Courier: {courier.id}</div>
                      <div>Status: {courier.status || "-"}</div>
                      <div>Available: {courier.isAvailable ? "yes" : "no"}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
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
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500 inline-block" /> Pickup
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" /> Courier
            </div>
          </div>
        </>
      )}
    </div>
  );
}
