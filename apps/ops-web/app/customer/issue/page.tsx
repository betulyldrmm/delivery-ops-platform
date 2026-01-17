"use client";

import { useState } from "react";
import { apiFetch } from "../../../lib/api";

export default function IssuePage() {
  const [orderId, setOrderId] = useState("");
  const [type, setType] = useState("MISSING");
  const [status, setStatus] = useState("");

  async function submit() {
    const res = await apiFetch(`/customer/orders/${orderId}/issues`, {
      method: "POST",
      body: JSON.stringify({ type })
    });
    setStatus(res.status);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Sorun Bildir</h1>
      <input
        className="border p-2 w-full"
        placeholder="Sipariş ID"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
      />
      <select className="border p-2 w-full mt-2" value={type} onChange={(e) => setType(e.target.value)}>
        <option value="MISSING">Eksik Ürün</option>
        <option value="DAMAGED">Hasarlı Ürün</option>
        <option value="LATE">Geç Teslim</option>
      </select>
      <button className="mt-2 px-3 py-2 bg-black text-white" onClick={submit}>
        Gönder
      </button>
      {status && <div className="text-sm mt-2">Durum: {status}</div>}
    </div>
  );
}
