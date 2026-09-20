import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-blue-700 px-6 py-12 text-white shadow-lg sm:px-10 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome to Grace Church
        </h1>
        <p className="mt-4 max-w-xl text-lg text-blue-100">
          A community following Jesus together. Join us this Sunday or watch live online.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/live"
            className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-800 shadow hover:bg-blue-50"
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

      <section className="grid gap-6 sm:grid-cols-3">
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
