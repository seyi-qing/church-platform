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
  const [open, setOpen] = useState(false);

  useEffect(() => {
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
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const accountLink =
    isLoggedIn && user ? (
      user.role === "member" ? (
        <Link
          href="/profile"
          className={`flex items-center gap-2 rounded-full border bg-slate-50 pl-2 pr-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 ${
            pathname === "/profile" ? "border-blue-500 bg-blue-50 text-blue-700" : ""
          }`}
        >
          <div className="h-6 w-6 rounded-full bg-blue-600 font-bold text-white flex items-center justify-center text-[10px] uppercase">
            {user.full_name?.substring(0, 2) || "ME"}
          </div>
          <span className="max-w-[80px] truncate">{user.full_name?.split(" ")[0]}</span>
        </Link>
      ) : (
        <Link
          href="/admin"
          className={`rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 ${
            pathname.startsWith("/admin") ? "bg-blue-600 hover:bg-blue-700" : ""
          }`}
        >
          Dashboard
        </Link>
      )
    ) : (
      <Link
        href="/admin/login"
        className="text-slate-400 font-semibold hover:text-blue-600"
      >
        Sign In
      </Link>
    );

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-extrabold text-blue-700 tracking-tight">
          Grace Church
        </Link>

        {/* Desktop links */}
        <nav className="hidden sm:flex items-center gap-5 text-sm font-medium text-slate-600">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`hover:text-blue-600 ${
                pathname === l.href ? "text-blue-600 font-semibold" : ""
              }`}
            >
              {l.label}
            </Link>
          ))}
          {accountLink}
        </nav>

        {/* Mobile: account + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          {accountLink}
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="sm:hidden border-t bg-white px-4 py-3 space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                pathname === l.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
