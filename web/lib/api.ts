import { getAccessToken, clearAuth } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const authToken = token !== undefined ? token : getAccessToken();
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      if (!p.startsWith("/login") && !p.startsWith("/admin/login")) {
        window.location.href = p.startsWith("/admin") ? "/admin/login" : "/login";
      }
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail[0]?.msg
          : res.statusText;
    throw new Error(message || "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export { API_URL };
