// app/template.tsx
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

  // 💡 CHECK: If the user is browsing an admin page, do not render the visitor navbar/footer!
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  // Otherwise, render the standard public white navbar layout for everyday church visitors
  return (
    <div className="flex flex-col min-h-screen">
      <WebPushBanner />
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t bg-white py-8 text-center text-sm text-slate-500">
        <p>
          © {new Date().getFullYear()} Grace Church. Built with the Church Platform.
        </p>
      </footer>
    </div>
  );
}
