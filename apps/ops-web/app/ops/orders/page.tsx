"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { getToken } from "../../../lib/auth";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);

  async function load() {
    const data = await apiFetch("/ops/orders?limit=20");
    setOrders(data);
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    load();
  }, [router]);

  async function setStatus(id: string, status: string) {
    await apiFetch(`/ops/orders/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status })
    });
    await load();
  }

  async function assign(id: string) {
    await apiFetch(`/ops/orders/${id}/assign-courier`, {
      method: "POST",
      body: JSON.stringify({ courier_id: "courier-demo" })
    });
    await load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Orders</h1>
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="p-3 bg-white border">
            <div className="text-sm">{o.id}</div>
            <div className="text-sm">Status: {o.status}</div>
            <div className="text-sm">Risk: {o.riskScore}</div>
            <div className="flex gap-2 mt-2">
              <button className="px-2 py-1 bg-gray-200" onClick={() => setStatus(o.id, "PREPARING")}>PREPARING</button>
              <button className="px-2 py-1 bg-gray-200" onClick={() => setStatus(o.id, "READY")}>READY</button>
              <button className="px-2 py-1 bg-gray-200" onClick={() => setStatus(o.id, "ON_ROUTE")}>ON_ROUTE</button>
              <button className="px-2 py-1 bg-gray-200" onClick={() => setStatus(o.id, "DELIVERED")}>DELIVERED</button>
              <button className="px-2 py-1 bg-black text-white" onClick={() => assign(o.id)}>Assign</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
