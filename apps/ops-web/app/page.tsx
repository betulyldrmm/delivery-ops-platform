"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "../lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const role = getRole();
    if (!role) {
      router.replace("/login");
      return;
    }
    if (role === "CUSTOMER") {
      router.replace("/customer");
      return;
    }
    if (role === "ADMIN") {
      router.replace("/admin");
      return;
    }
    router.replace("/ops");
  }, [router]);

  return <div className="text-sm text-gray-500">Redirecting...</div>;
}
