import { getToken } from "./auth";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

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
  const text = await res.text().catch(() => "");
  let data: unknown = text;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
