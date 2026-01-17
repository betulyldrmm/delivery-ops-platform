"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRole, getToken } from "../lib/auth";
import { ROLE_HOME } from "../lib/role-home";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const role = getRole();
    if (!token || !role) {
      router.replace("/login");
      return;
    }
    router.replace(ROLE_HOME[role] || "/login");
  }, [router]);

  return <div className="text-sm text-gray-500">Redirecting...</div>;
}
