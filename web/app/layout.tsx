import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { WebPushBanner } from "@/components/WebPushToggle";

export const metadata: Metadata = {
  title: "Grace Church",
  description: "Welcome to Grace Church – worship, community, and hope.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <WebPushBanner />
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t bg-white py-8 text-center text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} Grace Church. Built with the Church Platform.
          </p>
        </footer>
      </body>
    </html>
  );
}
