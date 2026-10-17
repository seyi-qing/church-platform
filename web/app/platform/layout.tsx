"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, getAccessToken, getStoredUser } from "@/lib/auth";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (pathname === "/platform/login") {
      setReady(true);
      return;
    }
    const token = getAccessToken();
    const u = getStoredUser();
    if (!token || !u?.is_superuser) {
      clearAuth();
      router.replace("/platform/login");
      return;
    }
    setUser(u);
    setReady(true);
  }, [pathname, router]);

  if (pathname === "/platform/login") {
    return <>{children}</>;
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading platform…
      </div>
    );
  }

  function logout() {
    clearAuth();
    try {
      localStorage.removeItem("active_tenant_id");
      localStorage.removeItem("active_tenant_name");
    } catch {
      /* ignore */
    }
    router.push("/platform/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-violet-900/20 bg-violet-950 text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300">
              ChurchPlatform · SaaS
            </p>
            <p className="text-sm font-bold">Platform command centre</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/platform"
              className="rounded-lg px-3 py-1.5 font-medium hover:bg-violet-900"
            >
              Dashboard
            </Link>
            <Link
              href="/admin"
              className="rounded-lg border border-violet-700 px-3 py-1.5 text-violet-100 hover:bg-violet-900"
            >
              Church admin
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-violet-200 hover:bg-violet-900"
            >
              Sign out
            </button>
          </nav>
        </div>
        <div className="border-t border-violet-900/40 bg-violet-900/40 px-4 py-1.5 text-center text-xs text-violet-200">
          Signed in as {user.full_name || user.email} · platform super-admin
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
