/** Public multi-tenant helpers for the church website. */

export type PublicOrg = {
  id: number;
  name: string;
  slug: string;
  tagline?: string | null;
  primary_color?: string | null;
  service_times?: string | null;
  address?: string | null;
};

export function readPublicTenantSlug(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromLs = localStorage.getItem("public_tenant_slug");
    if (fromLs) return fromLs;
    const m = document.cookie.match(/(?:^|; )tenant_slug=([^;]*)/);
    if (m) return decodeURIComponent(m[1]);
    const params = new URLSearchParams(window.location.search);
    return params.get("tenant");
  } catch {
    return null;
  }
}

export function setPublicTenantSlug(slug: string) {
  try {
    localStorage.setItem("public_tenant_slug", slug);
    document.cookie = `tenant_slug=${encodeURIComponent(slug)};path=/;max-age=2592000;samesite=lax`;
  } catch {
    /* ignore */
  }
}
