"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../../lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function UploadsPage() {
  const router = useRouter();
  const [batch, setBatch] = useState<any>(null);

  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, [router]);

  async function upload(file: File) {
    const token = getToken();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/ops/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
    const data = await res.json();
    setBatch(data);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">CSV Upload</h1>
      <input type="file" onChange={(e) => e.target.files && upload(e.target.files[0])} />
      {batch && <div className="text-sm mt-2">Batch: {batch.id} ({batch.status})</div>}
    </div>
  );
}
