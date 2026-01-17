"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";

type NavLink = { href: string; label: string };

const customerLinks: NavLink[] = [
  { href: "/customer", label: "Ana Sayfa" },
  { href: "/customer/sepet", label: "Sepet" },
  { href: "/customer/orders", label: "Siparişlerim" },
  { href: "/customer/notifications", label: "Bildirimler" },
  { href: "/customer/profile", label: "Profil" }
];

const opsLinks: NavLink[] = [
  { href: "/ops", label: "Dashboard" },
  { href: "/ops/orders", label: "Orders" },
  { href: "/ops/alerts", label: "Alerts" },
  { href: "/ops/map", label: "Map" },
  { href: "/ops/uploads", label: "Uploads" },
  { href: "/ops/inventory", label: "Inventory" },
  { href: "/ops/reports", label: "Reports" }
];

const adminLinks: NavLink[] = [{ href: "/admin", label: "Users & Roles" }];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, clearAuth } = useAuth();

  if (pathname === "/login") {
    return <main className="p-6">{children}</main>;
  }

  const sections: Array<{ title: string; links: NavLink[] }> = [];
  if (role === "CUSTOMER") {
    sections.push({ title: "Müşteri", links: customerLinks });
  }
  if (role === "OPS") {
    sections.push({ title: "Ops", links: opsLinks });
  }
  if (role === "ADMIN") {
    sections.push({ title: "Ops", links: opsLinks });
    sections.push({ title: "Admin", links: adminLinks });
  }

  function logout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      <aside className="w-60 bg-white border-r p-4">
        <div className="text-lg font-semibold mb-4">
          {role === "CUSTOMER" ? "Getir" : "Getir Console"}
        </div>
        <nav className="space-y-4 text-sm">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="text-xs uppercase text-gray-500 mb-2">{section.title}</div>
              <div className="space-y-2">
                {section.links.map((link) => (
                  <Link key={link.href} href={link.href} className="block">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        {role === "CUSTOMER" ? (
          <button className="mt-6 text-sm text-gray-700 underline" onClick={logout}>
            Çıkış
          </button>
        ) : (
          <button className="mt-6 text-xs text-gray-600 underline" onClick={logout}>
            Logout
          </button>
        )}
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
