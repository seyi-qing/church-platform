"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { WebPushBanner } from "@/components/WebPushToggle";
import { ContactSection } from "@/components/ContactSection";

export default function PublicVisitorTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  // Full /contact page already has the form — skip duplicate band there
  const showContactBand = pathname !== "/contact";

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
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center text-sm text-slate-500">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1" aria-label="Footer">
            <Link href="/contact" className="font-medium text-brand-700 hover:underline">
              Contact
            </Link>
            <Link href="/give" className="hover:text-slate-800 hover:underline">
              Give
            </Link>
            <Link href="/events" className="hover:text-slate-800 hover:underline">
              Events
            </Link>
            <Link href="/live" className="hover:text-slate-800 hover:underline">
              Live
            </Link>
            <Link href="/sermons" className="hover:text-slate-800 hover:underline">
              Sermons
            </Link>
          </nav>
          <p>© {new Date().getFullYear()} Grace Church</p>
        </div>
      </footer>
    </div>
  );
}
