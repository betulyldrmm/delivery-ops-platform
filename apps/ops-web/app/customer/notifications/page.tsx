"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/alerts").then(setAlerts);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Bildirimler</h1>
      {alerts.map((a) => (
        <div key={a.id} className="bg-white border rounded p-3 mb-2">
          <div className="text-sm font-medium">{a.type}</div>
          <div className="text-xs text-gray-500">{a.severity}</div>
        </div>
      ))}
      {!alerts.length && <div className="text-sm text-gray-500">Bildirim bulunamadı.</div>}
    </div>
  );
}
