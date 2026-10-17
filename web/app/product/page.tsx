import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChurchPlatform · Church apps, giving & media",
  description:
    "Launch a branded church website, member experience, livestream, giving, and staff tools.",
};

const FEATURES = [
  {
    title: "Branded public site",
    body: "Home, sermons, live, give, events, and gallery that look like your church.",
  },
  {
    title: "Member experience",
    body: "Sign-in, dashboard, giving history — app-like after login.",
  },
  {
    title: "Staff command center",
    body: "Members, visitors, groups, attendance, inquiries, and pastoral care.",
  },
  {
    title: "Multi-tenant SaaS",
    body: "Platform super-admin oversees churches, plans, and billing readiness.",
  },
];

export default function ProductMarketingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <span className="text-sm font-bold">ChurchPlatform</span>
          <nav className="flex gap-3 text-sm">
            <Link href="/" className="text-slate-300 hover:text-white">
              Demo church
            </Link>
            <Link href="/platform/login" className="text-violet-300 hover:text-white">
              Platform login
            </Link>
            <Link
              href="/admin/login"
              className="rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white"
            >
              Church staff
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="mx-auto max-w-3xl text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
          The church app stack your team can actually run
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
          Public site, member dashboard, livestream, giving, and staff tools — one platform.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900"
          >
            See demo church
          </Link>
          <Link
            href="/platform/login"
            className="rounded-xl border border-slate-600 px-6 py-3 text-sm font-semibold"
          >
            Platform super-admin
          </Link>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
