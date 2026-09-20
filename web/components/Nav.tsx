"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, getStoredUser, isStaffRole } from "@/lib/auth";

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
    const u = getStoredUser();
    if (token && u) {
      setIsLoggedIn(true);
      setUser(u);
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
      isStaffRole(user.role) || user.is_superuser ? (
        <Link
          href="/admin"
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
        >
          Dashboard
        </Link>
      ) : (
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-full border bg-slate-50 pl-2 pr-3 py-1 text-xs font-semibold text-slate-700"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            {(user.full_name || "ME").substring(0, 2).toUpperCase()}
          </div>
          <span className="max-w-[80px] truncate">{user.full_name?.split(" ")[0]}</span>
        </Link>
      )
    ) : (
      <Link href="/login" className="font-semibold text-slate-500 hover:text-blue-600">
        Sign In
      </Link>
    );

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-blue-700">
          Grace Church
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                pathname === l.href ? "font-semibold text-blue-600" : "hover:text-blue-600"
              }
            >
              {l.label}
            </Link>
          ))}
          {accountLink}
        </nav>
        <div className="flex items-center gap-2 sm:hidden">
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
      {open && (
        <nav className="space-y-1 border-t bg-white px-4 py-3 sm:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                pathname === l.href ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
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
