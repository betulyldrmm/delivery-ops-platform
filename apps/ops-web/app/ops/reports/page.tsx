"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { getToken } from "../../../lib/auth";

export default function ReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    apiFetch("/ops/reports?from=2024-01-01&to=2024-01-07").then(setData);
  }, [router]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Reports</h1>
      {data && <div className="text-sm">Avg ETA: {data.avg_eta}</div>}
    </div>
  );
}
