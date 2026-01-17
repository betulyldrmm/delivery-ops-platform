"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { getToken } from "../../lib/auth";

type CourierAssignment = {
  assignmentId: string;
  courierId: string;
  order: {
    id: string;
    status: string;
    currentEta: number;
    etaDeltaMinutes: number;
    addressLat?: number | null;
    addressLon?: number | null;
  };
};

const allowedStatuses = ["PICKED_UP", "ON_ROUTE", "DELIVERED"];

export default function CourierPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<CourierAssignment[]>([]);
  const [lat, setLat] = useState("41.02");
  const [lon, setLon] = useState("29.0");

  async function load() {
    const data = await apiFetch("/courier/orders");
    setAssignments(data);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    load();
  }, [router]);

  async function updateStatus(orderId: string, status: string) {
    await apiFetch(`/courier/orders/${orderId}/status`, {
      method: "POST",
      body: JSON.stringify({ status })
    });
    await load();
  }

  async function updateLocation() {
    await apiFetch("/courier/me/location", {
      method: "POST",
      body: JSON.stringify({ lat: Number(lat), lon: Number(lon) })
    });
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">My Assigned Orders</h1>
      <div className="bg-white border rounded p-4 mb-4 space-y-3">
        <div className="text-sm font-medium">Update my location</div>
        <div className="flex gap-2 text-sm">
          <input
            className="border px-2 py-1 w-28"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="lat"
          />
          <input
            className="border px-2 py-1 w-28"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            placeholder="lon"
          />
          <button className="px-3 py-1 bg-black text-white" onClick={updateLocation}>
            Send
          </button>
        </div>
      </div>
      {assignments.length === 0 && (
        <div className="text-sm text-gray-500">No assigned orders.</div>
      )}
      <div className="space-y-3">
        {assignments.map((assignment) => (
          <div key={assignment.assignmentId} className="p-3 bg-white border">
            <div className="text-sm">Order: {assignment.order.id}</div>
            <div className="text-sm">Status: {assignment.order.status}</div>
            <div className="text-sm">ETA: {assignment.order.currentEta} min</div>
            <div className="text-sm text-gray-600">
              Dropoff:{" "}
              {assignment.order.addressLat && assignment.order.addressLon
                ? `${assignment.order.addressLat.toFixed(4)}, ${assignment.order.addressLon.toFixed(4)}`
                : "n/a"}
            </div>
            <div className="flex gap-2 mt-2">
              {allowedStatuses.map((status) => (
                <button
                  key={status}
                  className="px-2 py-1 bg-gray-200"
                  onClick={() => updateStatus(assignment.order.id, status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
