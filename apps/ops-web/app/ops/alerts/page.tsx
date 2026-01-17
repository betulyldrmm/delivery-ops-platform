"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { getToken } from "../../../lib/auth";

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);

  async function load() {
    const data = await apiFetch("/ops/alerts?is_new=true");
    setAlerts(data);
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    load();
  }, [router]);

  async function ack(id: string) {
    await apiFetch(`/ops/alerts/${id}/ack`, { method: "POST" });
    await load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Risk Inbox</h1>
      {alerts.map((a) => (
        <div key={a.id} className="p-3 bg-white border mb-2">
          <div className="text-sm">{a.orderId}</div>
          <div className="text-sm">{a.type} / {a.severity}</div>
          <button className="px-2 py-1 bg-black text-white" onClick={() => ack(a.id)}>Ack</button>
        </div>
      ))}
    </div>
  );
}
