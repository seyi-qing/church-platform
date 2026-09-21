"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
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
  const menuId = useId();
  const menuBtnRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        menuBtnRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const accountLink =
    isLoggedIn && user ? (
      isStaffRole(user.role) || user.is_superuser ? (
        <Link
          href="/admin"
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Dashboard
        </Link>
      ) : (
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white"
            aria-hidden
          >
            {(user.full_name || "ME").substring(0, 2).toUpperCase()}
          </span>
          <span className="max-w-[100px] truncate">{user.full_name?.split(" ")[0]}</span>
        </Link>
      )
    ) : (
      <Link
        href="/login"
        className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Sign in
      </Link>
    );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="text-lg font-extrabold tracking-tight text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
        >
          Grace Church
        </Link>

        <nav
          className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex"
          aria-label="Main"
        >
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  active
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "hover:bg-slate-50 hover:text-blue-700"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <div className="ml-2">{accountLink}</div>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {accountLink}
          <button
            ref={menuBtnRef}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
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
        <nav
          id={menuId}
          aria-label="Mobile"
          className="space-y-1 border-t border-slate-100 bg-white px-3 py-3 md:hidden"
        >
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-lg px-3 py-3 text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  active ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
