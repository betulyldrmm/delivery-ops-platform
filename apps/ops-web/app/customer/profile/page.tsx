"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

export default function ProfilePage() {
  const [me, setMe] = useState<any>(null);
  const { clearAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    apiFetch("/auth/me").then(setMe);
  }, []);

  function roleLabel(role: string | undefined) {
    if (role === "CUSTOMER") return "Müşteri";
    if (role === "OPS") return "Operasyon";
    if (role === "ADMIN") return "Yönetici";
    return role || "-";
  }

  function logout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Profil</h1>
      <div className="bg-white border rounded p-4 space-y-2">
        <div className="text-sm text-gray-600">E-posta</div>
        <div className="font-medium">{me?.email || "-"}</div>
        <div className="text-sm text-gray-600 mt-2">Rol</div>
        <div className="font-medium">{roleLabel(me?.role)}</div>
      </div>
      <button className="mt-4 px-4 py-2 bg-gray-200 rounded" onClick={logout}>
        Çıkış Yap
      </button>
    </div>
  );
}
