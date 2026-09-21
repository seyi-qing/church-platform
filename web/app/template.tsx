"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/Nav";
import { WebPushBanner } from "@/components/WebPushToggle";

export default function PublicVisitorTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <WebPushBanner />
      <Nav />
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Grace Church</p>
      </footer>
    </div>
  );
}
