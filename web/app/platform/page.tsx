import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChurchPlatform · Church apps, giving & media",
  description:
    "Launch a branded church website, member app experience, livestream, giving, and staff tools — without building everything from scratch.",
};

const FEATURES = [
  {
    title: "Branded public site",
    body: "Home, sermons, live, give, events, and gallery that look like your church — not a generic template.",
  },
  {
    title: "Member experience",
    body: "Sign-in, profile, giving history, and a dashboard path that feels like an app after login.",
  },
  {
    title: "Watch & live",
    body: "Sermon library, series-ready media, and livestream that points to the tools churches already use.",
  },
  {
    title: "Give with confidence",
    body: "One-time and recurring gifts with Stripe, funds, and records staff can reconcile.",
  },
  {
    title: "Staff command center",
    body: "Members, visitors, groups, attendance, inquiries, announcements, and pastoral care in one admin.",
  },
  {
    title: "Roles that match real teams",
    body: "Admin, pastor, leader, secretary, treasurer — each sees the tools they need.",
  },
];

const STEPS = [
  { n: "1", t: "Connect your church", d: "Brand, campuses, and staff roles." },
  { n: "2", t: "Publish content", d: "Sermons, live links, events, gallery." },
  { n: "3", t: "Invite people", d: "Members sign in; guests explore the public site." },
  { n: "4", t: "Run Sunday", d: "Go live, take gifts, follow up inquiries." },
];

export default function PlatformLandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              CP
            </span>
            <span className="text-sm font-bold tracking-tight text-white sm:text-base">
              ChurchPlatform
            </span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/#features"
              className="hidden text-sm text-slate-400 hover:text-white sm:inline"
            >
              Product
            </Link>
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Live demo church
            </Link>
            <Link
              href="/admin/login"
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Staff login
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:pt-24">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Church software · SaaS
            </p>
            <h1 className="mx-auto mt-4 max-w-3xl text-center text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              The church app stack your team can actually run
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-center text-base text-slate-400 sm:text-lg">
              Public website, member experience, livestream, giving, and staff tools — one platform.
              Built for Sundays, not slide decks.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg hover:bg-slate-100"
              >
                See demo church site
              </Link>
              <Link
                href="/admin/login"
                className="rounded-xl border border-slate-600 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Open staff dashboard
              </Link>
            </div>
            <p className="mt-6 text-center text-xs text-slate-500">
              Demo: Grace Church public site + full admin. Multi-tenant SaaS is the product roadmap.
            </p>
          </div>
        </section>

        <section id="features" className="border-t border-slate-800 bg-slate-900/50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
              Everything a modern church expects
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-400">
              The same surface area as products like Subsplash — owned by you, shaped for your church.
            </p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-sm"
                >
                  <h3 className="text-base font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-bold text-white">How churches go live</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <div key={s.n} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <span className="text-2xl font-extrabold text-blue-500">{s.n}</span>
                  <p className="mt-2 font-semibold text-white">{s.t}</p>
                  <p className="mt-1 text-sm text-slate-400">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-800 bg-blue-600 py-14">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to see it with real church content?
            </h2>
            <p className="mt-3 text-sm text-blue-100">
              Browse the Grace Church demo site, or sign in as staff to walk the full admin.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-800 hover:bg-blue-50"
              >
                Visit public church site
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Member sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} ChurchPlatform · Product marketing</p>
        <p className="mt-1">
          <Link href="/" className="text-slate-400 hover:text-white">
            Church site
          </Link>
          {" · "}
          <Link href="/admin/login" className="text-slate-400 hover:text-white">
            Admin
          </Link>
        </p>
      </footer>
    </div>
  );
}
