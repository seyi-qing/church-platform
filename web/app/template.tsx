"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { WebPushBanner } from "@/components/WebPushToggle";
import { ContactSection } from "@/components/ContactSection";
import { getStoredUser, isStaffRole } from "@/lib/auth";

const FOOTER_LINKS = [
  { href: "/contact", label: "Contact" },
  { href: "/give", label: "Give" },
  { href: "/events", label: "Events" },
  { href: "/live", label: "Live" },
  { href: "/sermons", label: "Sermons" },
] as const;

function footerActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function PublicVisitorTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const u = getStoredUser<{ role?: string; is_superuser?: boolean }>();
    setIsStaff(!!(u && (isStaffRole(u.role) || u.is_superuser)));
  }, [pathname]);

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  // Contact form only on home — full form also lives at /contact
  // Staff already manage via admin; still allow home contact for testing if needed
  const showContactBand = pathname === "/" && !isStaff;

  return (
    <div className="flex min-h-screen flex-col">
      <WebPushBanner />
      <Nav />
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {children}
        {showContactBand && (
          <div className="mt-12 border-t border-slate-100 pt-10">
            <ContactSection />
          </div>
        )}
      </main>
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center text-sm text-slate-500">
          {/* Public shortcuts only for guests/members — staff use admin sidebar */}
          {!isStaff && (
            <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1" aria-label="Footer">
              {FOOTER_LINKS.map(({ href, label }) => {
                const active = footerActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "font-semibold text-brand-700 underline underline-offset-4 decoration-brand-600"
                        : "hover:text-slate-800 hover:underline"
                    }
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}
          <p>© {new Date().getFullYear()} Grace Church</p>
        </div>
      </footer>
    </div>
  );
}
