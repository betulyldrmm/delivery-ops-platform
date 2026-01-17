import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
  token?: string | null;
};

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const token = options.auth === false ? null : options.token ?? getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
