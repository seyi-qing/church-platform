import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Multi-tenant public sites:
 * - Subdomain: seyi.yourdomain.com → tenant slug "seyi"
 * - Query: ?tenant=seyi
 * - Path: /t/seyi/...
 * Cookie tenant_slug is read by apiFetch for X-Tenant-Slug header.
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const host = request.headers.get("host") || "";
  let slug: string | null = null;

  const q = url.searchParams.get("tenant");
  if (q) slug = q.trim().toLowerCase();

  const pathMatch = url.pathname.match(/^\/t\/([a-z0-9-]+)/i);
  if (!slug && pathMatch) slug = pathMatch[1].toLowerCase();

  const hostNoPort = host.split(":")[0];
  const parts = hostNoPort.split(".");
  if (!slug && parts.length >= 3 && !hostNoPort.endsWith("vercel.app")) {
    const sub = parts[0].toLowerCase();
    if (!["www", "api", "app", "platform", "admin"].includes(sub)) {
      slug = sub;
    }
  }

  const res = NextResponse.next();
  if (slug) {
    res.cookies.set("tenant_slug", slug, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    res.headers.set("x-tenant-slug", slug);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
