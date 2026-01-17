"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { getToken } from "../../lib/auth";

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);

  async function load() {
    const data = await apiFetch("/ops/admin/users");
    setUsers(data);
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    load();
  }, [router]);

  async function updateRole(userId: string, role: string) {
    await apiFetch("/ops/admin/roles", { method: "POST", body: JSON.stringify({ user_id: userId, role }) });
    await load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Admin</h1>
      {users.map((u) => (
        <div key={u.id} className="p-2 bg-white border mb-2">
          {u.email} - {u.role}
          <button className="ml-2 px-2 py-1 bg-gray-200" onClick={() => updateRole(u.id, "OPS")}>Set OPS</button>
          <button className="ml-2 px-2 py-1 bg-gray-200" onClick={() => updateRole(u.id, "COURIER")}>Set COURIER</button>
        </div>
      ))}
    </div>
  );
}
