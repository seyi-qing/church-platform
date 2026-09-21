"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccessToken, clearAuth, getStoredUser } from "@/lib/auth";

type NavItem = { href: string; label: string; roles: string[] };

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", roles: ["admin", "pastor", "leader", "secretary"] },
      { href: "/admin/analytics", label: "Analytics", roles: ["admin", "pastor"] },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/admin/members", label: "Members", roles: ["admin", "pastor", "leader", "secretary"] },
      { href: "/admin/visitors", label: "Visitors", roles: ["admin", "pastor", "leader", "secretary"] },
      { href: "/admin/attendance", label: "Attendance", roles: ["admin", "pastor", "leader", "secretary"] },
      { href: "/admin/care", label: "Care", roles: ["admin", "pastor", "leader", "secretary"] },
    ],
  },
  {
    title: "Ministry",
    items: [
      { href: "/admin/announcements", label: "Announcements", roles: ["admin", "pastor", "leader", "secretary"] },
      { href: "/admin/events", label: "Events", roles: ["admin", "pastor", "leader", "secretary"] },
      { href: "/admin/media", label: "Media", roles: ["admin", "pastor", "leader"] },
      { href: "/admin/livestream", label: "Livestream", roles: ["admin", "pastor", "leader"] },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/admin/giving", label: "Giving", roles: ["admin", "pastor"] },
      { href: "/admin/expenses", label: "Expenses", roles: ["admin", "pastor"] },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: "/admin/ai", label: "AI Tools", roles: ["admin", "pastor", "leader"] },
      { href: "/admin/pages", label: "Pages", roles: ["admin", "pastor"] },
    ],
  },
];

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
    setProfileOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (!ready || !user) {
    return <div className="p-8 font-medium text-slate-500">Syncing permissions…</div>;
  }

  function allowed(item: NavItem) {
    return item.roles.includes(user.role) || user.is_superuser;
  }

  function doLogout() {
    clearAuth();
    router.push("/admin/login");
  }

  function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        <div className="border-b border-slate-800 p-4">
          <div className="text-sm font-bold tracking-wide text-white">Church Admin</div>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-blue-300">
            {user.role}
          </p>
        </div>
        <nav className="mt-2 flex-1 space-y-3 overflow-y-auto px-2 pb-4">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter(allowed);
            if (!items.length) return null;
            return (
              <div key={group.title}>
                <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 p-2">
          <button
            type="button"
            onClick={doLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-400 hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-slate-900 text-slate-100 md:flex">
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-slate-900 px-4 py-3 text-white">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 hover:bg-slate-800 md:hidden"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">Church Admin</div>
            <div className="text-[10px] uppercase tracking-wider text-blue-300 md:hidden">
              {user.role}
            </div>
          </div>

          {/* Profile chip (member-style) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 py-1 pl-1 pr-3 hover:bg-slate-700"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">
                {initials(user.full_name)}
              </span>
              <span className="hidden max-w-[100px] truncate text-sm sm:inline">
                {user.full_name?.split(" ")[0] || user.email}
              </span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white py-1 text-slate-800 shadow-lg">
                <div className="border-b px-3 py-2">
                  <p className="truncate text-sm font-semibold">{user.full_name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <Link
                  href="/profile"
                  className="block px-3 py-2 text-sm hover:bg-slate-50"
                  onClick={() => setProfileOpen(false)}
                >
                  My profile
                </Link>
                <Link
                  href="/"
                  className="block px-3 py-2 text-sm hover:bg-slate-50"
                  onClick={() => setProfileOpen(false)}
                >
                  Public site
                </Link>
                <button
                  type="button"
                  onClick={doLogout}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
            <aside className="absolute bottom-0 left-0 top-0 flex w-72 flex-col bg-slate-900 text-slate-100 shadow-xl">
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
