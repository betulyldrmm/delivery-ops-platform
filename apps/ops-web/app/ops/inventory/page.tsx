"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { getToken } from "../../../lib/auth";

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    const data = await apiFetch("/ops/inventory");
    setItems(data);
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    load();
  }, [router]);

  async function update(id: string, qty: number) {
    await apiFetch(`/ops/inventory/${id}`, { method: "PATCH", body: JSON.stringify({ qty }) });
    await load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Inventory</h1>
      {items.map((i) => (
        <div key={i.id} className="p-2 bg-white border mb-2">
          {i.productName} - {i.qty}
          <button className="ml-2 px-2 py-1 bg-gray-200" onClick={() => update(i.id, i.qty + 1)}>+1</button>
        </div>
      ))}
    </div>
  );
}
