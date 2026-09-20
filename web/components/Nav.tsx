// components/Nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

const links = [
  { href: "/", label: "Home" },
  { href: "/sermons", label: "Sermons" },
  { href: "/events", label: "Events" },
  { href: "/live", label: "Live" },
  { href: "/give", label: "Give" },
];

export function Nav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 💡 Read execution state safely from the client-side hydration context
    const token = getToken();
    const cachedUser = localStorage.getItem("user");

    if (token && cachedUser) {
      setIsLoggedIn(true);
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        console.error(e);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  }, [pathname]); // Fires on route changes to keep the navbar synchronized instantly

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-extrabold text-brand-700 tracking-tight">
          Grace Church
        </Link>
        
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
          {links.map((l) => {
            const isTabActive = pathname === l.href;
            return (
              <Link 
                key={l.href} 
                href={l.href} 
                className={`transition hover:text-brand-600 ${isTabActive ? "text-brand-600 font-semibold" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}

          {/* 💡 THE DYNAMIC BADGE TRANSFORMER FIX */}
          {isLoggedIn && user ? (
            user.role === "member" ? (
              // 👤 Design for a Normal Member: Shows a clean avatar badge instead of the word "Admin"
              <Link 
                href="/profile" 
                className={`flex items-center gap-2 rounded-full border bg-slate-50 pl-2 pr-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition ${
                  pathname === "/profile" ? "border-brand-500 bg-brand-50 text-brand-700" : ""
                }`}
              >
                <div className="h-6 w-6 rounded-full bg-brand-600 font-bold text-white flex items-center justify-center text-[10px] uppercase">
                  {user.full_name?.substring(0, 2) || "ME"}
                </div>
                <span className="max-w-[80px] truncate">{user.full_name?.split(" ")[0]}</span>
              </Link>
            ) : (
              // 💼 Design for Staff / Admin / Pastor / Secretary
              <Link 
                href="/admin" 
                className={`rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition ${
                  pathname.startsWith("/admin") ? "bg-brand-600 hover:bg-brand-700" : ""
                }`}
              >
                Dashboard
              </Link>
            )
          ) : (
            // 🔓 Design when Logged Out completely
            <Link 
              href="/admin/login" 
              className="text-slate-400 font-semibold hover:text-brand-600 transition"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
      }
