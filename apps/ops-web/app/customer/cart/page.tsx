"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CartRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/customer/sepet");
  }, [router]);

  return <div className="text-sm text-gray-500">Yönlendiriliyor...</div>;
}
