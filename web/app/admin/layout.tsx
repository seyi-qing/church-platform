"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, logout } from "@/lib/auth";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/livestream", label: "Livestream" },
  { href: "/admin/giving", label: "Giving" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/ai", label: "AI Tools" },
  { href: "/admin/care", label: "Care" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // 💡 FIX 1: Run token validation ONLY ONCE when the dashboard components mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = getToken();
      if (!token && window.location.pathname !== "/admin/login") {
        router.replace("/admin/login");
      } else {
        setReady(true);
      }
    }
  }, [router]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (!ready) return <div className="p-8 text-slate-500">Loading…</div>;

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r bg-slate-900 text-slate-100">
        <div className="p-4 text-sm font-bold tracking-wide text-white">Admin</div>
        <nav className="space-y-0.5 px-2 pb-4">
          {nav.map((item) => {
            // 💡 FIX 2: Handle matching sub-routes accurately (e.g. matching /admin/media/1)
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/admin/login");
          }}
          className="mx-2 mb-4 block w-[calc(100%-1rem)] rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-800"
        >
          Sign out
        </button>
      </aside>
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
  }
