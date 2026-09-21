"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccessToken, clearAuth, getStoredUser } from "@/lib/auth";

const nav = [
  { href: "/admin", label: "Dashboard", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/announcements", label: "Announcements", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/members", label: "Members", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/visitors", label: "Visitors", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/attendance", label: "Attendance", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/events", label: "Events", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/media", label: "Media", roles: ["admin", "pastor", "leader"] },
  { href: "/admin/livestream", label: "Livestream", roles: ["admin", "pastor", "leader"] },
  { href: "/admin/giving", label: "Giving", roles: ["admin", "pastor"] },
  { href: "/admin/expenses", label: "Expenses", roles: ["admin", "pastor"] },
  { href: "/admin/care", label: "Care", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/ai", label: "AI Tools", roles: ["admin", "pastor", "leader"] },
  { href: "/admin/analytics", label: "Analytics", roles: ["admin", "pastor"] },
  { href: "/admin/pages", label: "Pages", roles: ["admin", "pastor"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      clearAuth();
      router.replace("/admin/login");
      return;
    }

    const parsedUser = getStoredUser();
    if (parsedUser) {
      setUser(parsedUser);
      if (
        !["admin", "pastor", "leader", "secretary"].includes(parsedUser.role) &&
        !parsedUser.is_superuser
      ) {
        router.replace("/profile");
        return;
      }
    }
    setReady(true);
  }, [pathname, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (!ready || !user) {
    return <div className="p-8 font-medium text-slate-500">Syncing permissions…</div>;
  }

  const links = nav.filter(
    (item) => item.roles.includes(user.role) || user.is_superuser
  );

  function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        <div className="border-b border-slate-800 p-4">
          <div className="text-sm font-bold tracking-wide text-white">Church Admin</div>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-blue-300">
            {user.role}
          </p>
        </div>
        <nav className="mt-4 flex-1 space-y-0.5 px-2">
          {links.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 p-2">
          <button
            type="button"
            onClick={() => {
              clearAuth();
              router.push("/admin/login");
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-400 transition hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-56 shrink-0 flex-col justify-between border-r bg-slate-900 text-slate-100 md:flex">
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-slate-900 px-4 py-3 text-white md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 hover:bg-slate-800"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="text-sm font-bold">Church Admin</div>
            <div className="text-[10px] uppercase tracking-wider text-blue-300">{user.role}</div>
          </div>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
            <aside className="absolute bottom-0 left-0 top-0 flex w-64 flex-col bg-slate-900 text-slate-100 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 p-4">
                <span className="text-sm font-bold text-white">Menu</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
              <SidebarNav onNavigate={() => setMenuOpen(false)} />
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
