"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { getToken } from "../../lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    apiFetch("/ops/dashboard").then(setData).catch(() => setData(null));
  }, [router]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>
      {!data && <div className="text-sm text-gray-500">Loading KPIs...</div>}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-white border">Active: {data.kpis.active_orders}</div>
          <div className="p-4 bg-white border">Delayed: {data.kpis.delayed_orders}</div>
          <div className="p-4 bg-white border">SLA Breach: {data.kpis.sla_breached_orders}</div>
        </div>
      )}
    </div>
  );
}
