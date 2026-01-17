"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ grant_type: "password", identifier, password })
      });
      setAuth(res.access_token, res.user.role);
      if (res.user.role === "CUSTOMER") {
        router.push("/customer");
        return;
      }
      if (res.user.role === "ADMIN") {
        router.push("/admin");
        return;
      }
      router.push("/ops");
    } catch (err: any) {
      setError("Giris basarisiz");
    }
  }

  return (
    <div className="max-w-sm">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border p-2"
          placeholder="Email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <input
          className="w-full border p-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="px-4 py-2 bg-black text-white" type="submit">
          Login
        </button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </form>
    </div>
  );
}
