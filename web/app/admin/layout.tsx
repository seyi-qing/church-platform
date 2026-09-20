"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, logout } from "@/lib/auth";

const nav = [
  { href: "/admin", label: "Dashboard", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/members", label: "Members", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/care", label: "Care Workflow", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/ai", label: "AI Tools", roles: ["admin", "pastor", "leader"] },
  { href: "/admin/events", label: "Events", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/livestream", label: "Livestream", roles: ["admin", "pastor", "leader"] },
  { href: "/admin/giving", label: "Giving Logs", roles: ["admin", "pastor"] },
  { href: "/admin/analytics", label: "Analytics", roles: ["admin", "pastor"] },
  { href: "/admin/pages", label: "System Pages", roles: ["admin", "pastor"] },
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

    const token = getToken();
    const storedUser = localStorage.getItem("user");

    if (!token) {
      localStorage.clear();
      router.replace("/admin/login");
      return;
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        if (
          !["admin", "pastor", "leader", "secretary"].includes(parsedUser.role) &&
          !parsedUser.is_superuser
        ) {
          router.replace("/profile");
          return;
        }
      } catch (e) {
        console.error("Error decoding session profile payload:", e);
      }
    }
    setReady(true);
  }, [pathname, router]);

  // Close drawer on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (!ready || !user) {
    return (
      <div className="p-8 text-slate-500 font-medium">Syncing permissions…</div>
    );
  }

  const links = nav.filter(
    (item) => item.roles.includes(user.role) || user.is_superuser
  );

  function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        <div className="p-4 border-b border-slate-800">
          <div className="text-sm font-bold tracking-wide text-white">Church Admin</div>
          <p className="text-xs text-blue-300 font-semibold mt-0.5 uppercase tracking-wider">
            {user.role}
          </p>
        </div>
        <nav className="space-y-0.5 px-2 mt-4 flex-1">
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
        <div className="p-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              logout();
              localStorage.clear();
              router.push("/admin/login");
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-800 font-medium transition"
          >
            Sign out
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r bg-slate-900 text-slate-100 flex-col justify-between">
        <SidebarNav />
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-40 flex items-center gap-3 border-b bg-slate-900 px-4 py-3 text-white">
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

        {/* Mobile drawer overlay */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 text-slate-100 flex flex-col shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <span className="text-sm font-bold text-white">Menu</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
