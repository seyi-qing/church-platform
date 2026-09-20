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
  const [user, setUser] = useState<any>(null);

  // 💡 Check authentication strictly ONCE when the administrative frame mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = getToken();
      const storedUser = localStorage.getItem("user");

      if (!token && window.location.pathname !== "/admin/login") {
        router.replace("/admin/login");
      } else {
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error(e);
          }
        }
        setReady(true);
      }
    }
  }, [router]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (!ready) return <div className="p-8 text-slate-500 font-medium">Loading panel workspace...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Persistent Administrative Sidebar */}
      <aside className="w-56 shrink-0 border-r bg-slate-900 text-slate-100 flex flex-col justify-between">
        <div>
          <div className="p-4 border-b border-slate-800">
            <div className="text-sm font-bold tracking-wide text-white">Church Admin</div>
            {/* 💡 Display user profile name seamlessly inside the sidebar header */}
            {user && (
              <p className="text-xs text-slate-400 mt-1 truncate">
                {user.full_name || user.email}
              </p>
            )}
          </div>
          <nav className="space-y-0.5 px-2 mt-4">
            {nav.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
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

      {/* Primary Page Canvas */}
      <div className="flex-1 overflow-auto p-8">{children}</div>
    </div>
  );
    }
