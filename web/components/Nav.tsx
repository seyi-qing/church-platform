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
  { href: "/contact", label: "Contact" },
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

  const accountSection = (
    <>
      {isLoggedIn && (
        <div className="border-b border-slate-100 px-3 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
              {initials(user?.full_name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.full_name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
        </div>
      )}
      {isLoggedIn && (
        <>
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
      )}
      {!isLoggedIn && (
        <Link
          href="/login"
          role="menuitem"
          className="block px-3 py-2.5 text-sm font-semibold text-brand-700 hover:bg-slate-50"
          onClick={() => setMenuOpen(false)}
        >
          Sign in
        </Link>
      )}
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
        <Link href="/" className="flex min-w-0 items-center" onClick={() => setMenuOpen(false)}>
          <ChurchLogo size={32} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-blue-50 text-blue-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Desktop: initials + name when logged in */}
          {isLoggedIn ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                ref={menuBtnRef}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                  {initials(user?.full_name)}
                </span>
                <span className="max-w-[100px] truncate text-sm font-medium text-slate-800">
                  {user?.full_name?.split(" ")[0] || "Account"}
                </span>
              </button>
              {menuOpen && (
                <div
                  id={menuId}
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                >
                  {accountSection}
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 md:inline-block"
            >
              Sign in
            </Link>
          )}

          {/* Mobile: initials when logged in, hamburger when not */}
          {isLoggedIn ? (
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full md:hidden"
              aria-label="Open account menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800 ring-2 ring-white shadow-sm">
                {initials(user?.full_name)}
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-200 md:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile panel */}
      {menuOpen && (
        <div className="border-t border-slate-100 bg-white shadow-inner md:hidden">
          <nav className="mx-auto max-w-6xl px-2 py-2" aria-label="Mobile">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                    active ? "bg-blue-50 text-blue-800" : "text-slate-800 hover:bg-slate-50"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="mt-1 border-t border-slate-100 pt-1">{accountSection}</div>
          </nav>
        </div>
      )}
    </header>
  );
}
