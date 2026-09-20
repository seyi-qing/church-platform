"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, logout } from "@/lib/auth";

// Define navigation nodes along with their explicit role allowances
const nav = [
  { href: "/admin", label: "Dashboard", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/members", label: "Members", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/care", label: "Care Workflow", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/ai", label: "AI Tools", roles: ["admin", "pastor", "leader"] },
  { href: "/admin/events", label: "Events", roles: ["admin", "pastor", "leader", "secretary"] },
  { href: "/admin/livestream", label: "Livestream", roles: ["admin", "pastor", "leader"] },
  { href: "/admin/giving", label: "Giving Logs", roles: ["admin", "pastor"] }, // 🔒 Hidden from operations staff
  { href: "/admin/analytics", label: "Analytics", roles: ["admin", "pastor"] }, // 🔒 Hidden from operations staff
  { href: "/admin/pages", label: "System Pages", roles: ["admin", "pastor"] }, // 🔒 Hidden from operations staff
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);

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

        // 💡 REDIRECT GUARD: If a standard member accidentally visits an /admin path, route them out!
        if (!["admin", "pastor", "leader", "secretary"].includes(parsedUser.role) && !parsedUser.is_superuser) {
          router.replace("/profile");
          return;
        }
      } catch (e) {
        console.error("Error decoding session profile payload:", e);
      }
    }
    setReady(true);
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (!ready || !user) return <div className="p-8 text-slate-500 font-medium">Syncing permissions grid...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 shrink-0 border-r bg-slate-900 text-slate-100 flex flex-col justify-between">
        <div>
          <div className="p-4 border-b border-slate-800">
            <div className="text-sm font-bold tracking-wide text-white">Church Admin</div>
            <p className="text-xs text-brand-400 font-semibold mt-0.5 uppercase tracking-wider">{user.role}</p>
          </div>
          <nav className="space-y-0.5 px-2 mt-4">
            {nav
              // 💡 FILTER: Only show tabs this specific user's role is allowed to click!
              .filter((item) => item.roles.includes(user.role) || user.is_superuser)
              .map((item) => {
                const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
          </nav>
        </div>
        
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
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
  }
      
