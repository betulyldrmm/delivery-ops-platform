"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, role, user, clearAuth } = useAuth();

  const whoAmI = user?.email ? `${user.email} (${role || "-"})` : role ? `(${role})` : "Not signed in";

  function logout() {
    clearAuth();
    router.replace("/login");
  }

  const showShell = pathname !== "/login";

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {showShell && (
        <header className="flex items-center justify-between px-4 py-3 border-b text-sm">
          <div className="text-gray-600">
            Signed in as <span className="font-medium text-gray-900">{whoAmI}</span>
          </div>
          {token ? (
            <button className="text-gray-700 underline" onClick={logout}>
              Logout
            </button>
          ) : (
            <Link className="text-gray-700 underline" href="/login">
              Login
            </Link>
          )}
        </header>
      )}
      <main className="p-4 pb-16">{children}</main>
      {showShell && (
        <nav className="fixed bottom-0 left-0 right-0 border-t bg-white flex justify-around text-xs py-2">
          <Link href="/">Home</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/notifications">Alerts</Link>
          <Link href="/profile">Profile</Link>
        </nav>
      )}
    </div>
  );
}
