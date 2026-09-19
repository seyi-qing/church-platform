import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-20 text-white shadow-lg">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Welcome to Grace Church
        </h1>
        <p className="mt-4 max-w-xl text-lg text-brand-100">
          A community following Jesus together. Join us this Sunday or watch live online.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/live"
            className="rounded-lg bg-white px-6 py-3 font-semibold text-brand-800 shadow hover:bg-brand-50"
          >
            Watch Live
          </Link>
          <Link
            href="/give"
            className="rounded-lg border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            Give Online
          </Link>
        </div>
      </section>

      <section className="grid gap-8 sm:grid-cols-3">
        <FeatureCard
          title="Sermons"
          description="Catch up on recent messages and series anytime."
          href="/sermons"
        />
        <FeatureCard
          title="Events"
          description="Find gatherings, classes, and ways to get involved."
          href="/events"
        />
        <FeatureCard
          title="Give"
          description="Support the mission with secure online giving."
          href="/give"
        />
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </Link>
  );
}
