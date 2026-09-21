"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { clearAuth, getToken, getStoredUser, isStaffRole } from "@/lib/auth";
import { ChurchLogo } from "@/components/ChurchLogo";

const links = [
  { href: "/", label: "Home" },
  { href: "/sermons", label: "Sermons" },
  { href: "/gallery", label: "Gallery" },
  { href: "/events", label: "Events" },
  { href: "/live", label: "Live" },
  { href: "/give", label: "Give" },
];

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuBtnRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const staff = !!(user && (isStaffRole(user.role) || user.is_superuser));

  function signOut() {
    clearAuth();
    setMenuOpen(false);
    router.push("/");
  }

  const accountMenuItems = (
    <>
      <div className="border-b border-slate-100 px-3 py-2">
        <p className="truncate text-sm font-semibold text-slate-900">{user?.full_name}</p>
        <p className="truncate text-xs text-slate-500">{user?.email}</p>
      </div>
      <Link
        href="/profile"
        role="menuitem"
        className="block px-3 py-2.5 text-sm text-slate-800 hover:bg-slate-50"
        onClick={() => setMenuOpen(false)}
      >
        My profile
      </Link>
      {staff && (
        <Link
          href="/admin"
          role="menuitem"
          className="block px-3 py-2.5 text-sm text-slate-800 hover:bg-slate-50"
          onClick={() => setMenuOpen(false)}
        >
          Staff dashboard
        </Link>
      )}
      {!staff && (
        <Link
          href="/give"
          role="menuitem"
          className="block px-3 py-2.5 text-sm text-slate-800 hover:bg-slate-50"
          onClick={() => setMenuOpen(false)}
        >
          Give
        </Link>
      )}
      <button
        type="button"
        role="menuitem"
        onClick={signOut}
        className="w-full px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
      >
        Sign out
      </button>
    </>
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
          className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <ChurchLogo size={32} />
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
                className={`rounded-lg px-3 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  active
                    ? "bg-brand-50 font-semibold text-brand-700"
                    : "hover:bg-slate-50 hover:text-brand-700"
                }`}
              >
                {l.label}
              </Link>
            );
          })}

          {!isLoggedIn && (
            <Link
              href="/login"
              className="ml-2 rounded-lg px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Sign in
            </Link>
          )}

          {isLoggedIn && user && (
            <div className="relative ml-2">
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {initials(user.full_name)}
                </span>
                <span className="max-w-[100px] truncate">{user.full_name?.split(" ")[0]}</span>
              </button>
              {menuOpen && (
                <div
                  id={menuId}
                  role="menu"
                  className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                >
                  {accountMenuItems}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {!isLoggedIn && (
            <>
              <Link href="/login" className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-600">
                Sign in
              </Link>
              <button
                ref={menuBtnRef}
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </>
          )}

          {isLoggedIn && user && (
            <button
              ref={menuBtnRef}
              type="button"
              aria-label="Account menu"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center rounded-full border border-slate-200 bg-white p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {initials(user.full_name)}
              </span>
            </button>
          )}
        </div>
      </div>

      {menuOpen && (
        <div id={menuId} className="border-t border-slate-100 bg-white px-3 py-3 md:hidden" role="menu">
          {!isLoggedIn && (
            <nav className="space-y-1" aria-label="Mobile">
              {links.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    role="menuitem"
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-lg px-3 py-3 text-base font-medium ${
                      active ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {isLoggedIn && user && (
            <div className="space-y-1 [&>a]:rounded-lg [&>a]:px-3 [&>a]:py-3 [&>a]:text-base [&>button]:rounded-lg [&>button]:px-3 [&>button]:py-3 [&>button]:text-base">
              {accountMenuItems}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
