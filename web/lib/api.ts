import { getAccessToken, clearAuth } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getTenantSlug(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromLs = localStorage.getItem("public_tenant_slug");
    if (fromLs) return fromLs;
    const m = document.cookie.match(/(?:^|; )tenant_slug=([^;]*)/);
    if (m) return decodeURIComponent(m[1]);
    const params = new URLSearchParams(window.location.search);
    const q = params.get("tenant");
    if (q) return q;
  } catch {
    /* ignore */
  }
  return null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const tenantSlug = getTenantSlug();
  if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;

  const auth = token ?? getAccessToken();
  if (auth) headers["Authorization"] = `Bearer ${auth}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuth();
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || body.message || detail;
      if (Array.isArray(detail)) detail = detail.map((d: any) => d.msg || d).join(", ");
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export { API_URL };
