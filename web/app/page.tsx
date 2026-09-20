"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

type MediaItem = {
  id: number;
  title: string;
  description: string | null;
  speaker: string | null;
};

type EventItem = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
};

export default function HomePage() {
  const [sermons, setSermons] = useState<MediaItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 90000);

    fetch(`${API_URL}/media/items?media_type=sermon&limit=3`, {
      signal: ctrl.signal,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSermons(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch(`${API_URL}/events?limit=3`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setEvents(Array.isArray(d) ? d : []))
      .catch(() => {});

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, []);

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

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Latest sermons</h2>
            <p className="mt-1 text-sm text-slate-500">Recent messages from Sunday gatherings</p>
          </div>
          <Link href="/sermons" className="text-sm font-semibold text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {sermons.length === 0 ? (
          <p className="rounded-xl border bg-white p-6 text-sm text-slate-500">
            Loading sermons… or none published yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {sermons.map((s) => (
              <Link
                key={s.id}
                href="/sermons"
                className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
                  Sermon
                </div>
                <h3 className="font-semibold text-slate-900">{s.title}</h3>
                {s.speaker && <p className="mt-1 text-sm text-slate-500">{s.speaker}</p>}
                {s.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{s.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Upcoming events</h2>
            <p className="mt-1 text-sm text-slate-500">Gatherings and ways to get involved</p>
          </div>
          <Link href="/events" className="text-sm font-semibold text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="rounded-xl border bg-white p-6 text-sm text-slate-500">
            Loading events… or none listed yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="rounded-xl border bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900">{e.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(e.start_at).toLocaleString()}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
                {e.description && (
                  <p className="mt-2 text-sm text-slate-600">{e.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
