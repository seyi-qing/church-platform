"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccessToken, clearAuth, getStoredUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type NavItem = { href: string; label: string; roles: string[]; superOnly?: boolean };

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Platform",
    items: [
      { href: "/admin/platform", label: "Tenants & plans", roles: ["admin"], superOnly: true },
    ],
  },
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
      { href: "/admin/inquiries", label: "Inquiries", roles: ["admin", "pastor", "leader", "secretary"] },
      { href: "/admin/groups", label: "Groups", roles: ["admin", "pastor", "leader"] },
      { href: "/admin/attendance", label: "Attendance", roles: ["admin", "pastor", "leader", "secretary"] },
    ],
  },
  {
    title: "Ministry",
    items: [
      { href: "/admin/events", label: "Events", roles: ["admin", "pastor", "leader", "secretary"] },
      { href: "/admin/announcements", label: "Announcements", roles: ["admin", "pastor", "leader", "secretary"] },
      { href: "/admin/care", label: "Pastoral care", roles: ["admin", "pastor", "leader"] },
      { href: "/admin/meetings", label: "Meetings", roles: ["admin", "pastor", "leader", "secretary"] },
    ],
  },
  {
    title: "Media",
    items: [
      { href: "/admin/media", label: "Media / Playlists", roles: ["admin", "pastor", "leader"] },
      { href: "/admin/livestream", label: "Livestream", roles: ["admin", "pastor", "leader"] },
      { href: "/admin/gallery", label: "Gallery", roles: ["admin", "pastor", "leader", "secretary"] },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/admin/giving", label: "Giving", roles: ["admin", "pastor", "treasurer"] },
      { href: "/admin/expenses", label: "Expenses", roles: ["admin", "pastor", "treasurer"] },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: "/admin/ai", label: "AI tools", roles: ["admin", "pastor"] },
      { href: "/admin/communications", label: "Communications", roles: ["admin", "pastor", "leader", "secretary"] },
      { href: "/admin/campuses", label: "Campuses", roles: ["admin", "pastor"] },
      { href: "/admin/pages", label: "Pages", roles: ["admin", "pastor"] },
      { href: "/admin/settings", label: "Church settings", roles: ["admin", "pastor"] },
    ],
  },
];

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [churchName, setChurchName] = useState("Church");

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
    const u = getStoredUser();
    if (!u) {
      clearAuth();
      router.replace("/admin/login");
      return;
    }
    const role = (u as any).role;
    const staff =
      (u as any).is_superuser ||
      ["admin", "pastor", "leader", "secretary", "treasurer"].includes(role);
    if (!staff) {
      router.replace("/profile");
      return;
    }
    setUser(u);
    setReady(true);
    apiFetch<{ name?: string }>("/tenants/current")
      .then((org) => {
        if (org?.name) {
          setChurchName(org.name);
          try {
            localStorage.setItem("active_tenant_name", org.name);
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        try {
          const cached = localStorage.getItem("active_tenant_name");
          if (cached) setChurchName(cached);
        } catch {
          /* ignore */
        }
      });
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
    if (item.superOnly) return !!user.is_superuser;
    return item.roles.includes(user.role) || user.is_superuser;
  }

  function doLogout() {
    clearAuth();
    try {
      localStorage.removeItem("active_tenant_id");
      localStorage.removeItem("active_tenant_name");
      localStorage.removeItem("public_tenant_slug");
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    } else {
      router.push("/admin/login");
    }
  }

  function roleBadge() {
    if (user?.is_superuser) return "Platform";
    const r = (user?.role || "staff").toString();
    return r.charAt(0).toUpperCase() + r.slice(1);
  }

  function SidebarNav({ onNavigate, hideBrand }: { onNavigate?: () => void; hideBrand?: boolean }) {
    return (
      <>
        {!hideBrand && (
          <div className="border-b border-slate-800 p-4">
            <div className="text-sm font-bold tracking-wide text-white">{churchName}</div>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-blue-300">
              {roleBadge()}
            </p>
            {churchName && churchName !== "Church" && (
              <p className="mt-0.5 text-[10px] font-medium text-emerald-300">
                Working as {churchName}
              </p>
            )}
          </div>
        )}
        <nav className="mt-2 flex-1 space-y-3 overflow-y-auto px-2 pb-4" aria-label="Admin">
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
                        aria-current={isActive ? "page" : undefined}
                        className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
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
        <div className="space-y-0.5 border-t border-slate-800 p-2">
          <Link
            href="/"
            onClick={onNavigate}
            className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-blue-300 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            View public site
          </Link>
          {user.is_superuser && (
            <Link
              href="/platform"
              onClick={onNavigate}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-violet-300 hover:bg-slate-800"
            >
              Platform console
            </Link>
          )}
          <button
            type="button"
            onClick={doLogout}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-400 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            Sign out
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-slate-900 text-slate-100 lg:flex">
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-slate-900 px-4 py-3 text-white">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:hidden"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">{churchName}</div>
            <div className="text-[10px] uppercase tracking-wider text-blue-300">{roleBadge()}</div>
          </div>

          <Link
            href="/"
            className="hidden rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 sm:inline-block"
          >
            View public site
          </Link>

          <div className="relative">
            <button
              type="button"
              aria-label="Account menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 py-1 pl-1 pr-3 hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">
                {initials(user.full_name)}
              </span>
              <span className="hidden max-w-[120px] truncate text-sm sm:inline">
                {user.full_name?.split(" ")[0] || user.email}
              </span>
            </button>
            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1 text-slate-800 shadow-lg"
              >
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-sm font-semibold">{user.full_name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <Link
                  href="/"
                  role="menuitem"
                  className="block px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-blue-50"
                  onClick={() => setProfileOpen(false)}
                >
                  View public site
                </Link>
                <Link
                  href="/profile"
                  role="menuitem"
                  className="block px-3 py-2.5 text-sm hover:bg-slate-50"
                  onClick={() => setProfileOpen(false)}
                >
                  My profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={doLogout}
                  className="w-full px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <aside
              className="absolute bottom-0 left-0 top-0 flex w-[min(18rem,85vw)] flex-col bg-slate-900 text-slate-100 shadow-xl"
              role="dialog"
              aria-label="Admin menu"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 p-4">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold tracking-wide text-white">{churchName}</div>
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-blue-300">
                    {roleBadge()}
                  </p>
                  {churchName && churchName !== "Church" && (
                    <p className="mt-0.5 text-[10px] font-medium text-emerald-300">
                      Working as {churchName}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SidebarNav onNavigate={() => setMenuOpen(false)} hideBrand />
            </aside>
          </div>
        )}

        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
